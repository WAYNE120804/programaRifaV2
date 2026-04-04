import crypto from 'node:crypto';

import { env } from '../../config/env';
import {
  EstadoBoleta,
  EstadoPago,
  EstadoVenta,
  MetodoPago,
  Prisma,
} from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { ReservaCheckoutPayload } from './checkout-publico.schemas';

const RESERVA_TTL_MINUTES = 15;
const CANAL_WEB_VENDOR_NAME = 'PAGINA WEB';
const WOMPI_WEB_SUBCAJA = 'WOMPI WEB';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function buildReservaReferencia() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RES-${Date.now()}-${random}`;
}

function decimalToAmountInCents(value: Prisma.Decimal) {
  return Number(value.mul(100).toFixed(0));
}

function buildWompiIntegritySignature({
  reference,
  amountInCents,
  currency,
}: {
  reference: string;
  amountInCents: number;
  currency: string;
}) {
  if (!env.wompiIntegritySecret) {
    throw new AppError(
      'WOMPI_INTEGRITY_SECRET no esta configurado en el backend.',
      500
    );
  }

  const base = `${reference}${amountInCents}${currency}${env.wompiIntegritySecret}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function buildWompiIntegritySource({
  reference,
  amountInCents,
  currency,
}: {
  reference: string;
  amountInCents: number;
  currency: string;
}) {
  return `${reference}${amountInCents}${currency}${env.wompiIntegritySecret}`;
}

function getWompiBaseUrl() {
  return env.wompiEnv === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

const WOMPI_FINAL_APPROVED_STATES = new Set(['APPROVED']);
const WOMPI_FINAL_REJECTED_STATES = new Set(['DECLINED', 'VOIDED', 'ERROR']);

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}

function buildWompiEventChecksum(body: Record<string, unknown>) {
  const signature = body.signature;
  const timestamp = body.timestamp;

  if (!signature || typeof signature !== 'object') {
    throw new AppError('El webhook de Wompi no incluye firma.', 400);
  }

  const checksum = (signature as Record<string, unknown>).checksum;
  const properties = (signature as Record<string, unknown>).properties;

  if (typeof checksum !== 'string' || !checksum.trim()) {
    throw new AppError('El webhook de Wompi no incluye checksum.', 400);
  }

  if (!Array.isArray(properties) || !properties.length) {
    throw new AppError('El webhook de Wompi no incluye propiedades de firma.', 400);
  }

  if (typeof timestamp !== 'number' && typeof timestamp !== 'string') {
    throw new AppError('El webhook de Wompi no incluye timestamp valido.', 400);
  }

  if (!env.wompiEventsSecret) {
    throw new AppError('WOMPI_EVENTS_SECRET no esta configurado en el backend.', 500);
  }

  const data = body.data;
  if (!data || typeof data !== 'object') {
    throw new AppError('El webhook de Wompi no incluye data valida.', 400);
  }

  const concatenated = properties
    .map((property) => {
      if (typeof property !== 'string') {
        throw new AppError('El webhook de Wompi incluye una propiedad de firma invalida.', 400);
      }

      const value = getNestedValue(data as Record<string, unknown>, property);
      if (typeof value === 'undefined' || value === null) {
        return '';
      }

      return String(value);
    })
    .join('');

  const computed = crypto
    .createHash('sha256')
    .update(`${concatenated}${timestamp}${env.wompiEventsSecret}`)
    .digest('hex');

  return {
    providedChecksum: checksum.toLowerCase(),
    computedChecksum: computed.toLowerCase(),
  };
}

async function upsertCliente(
  tx: Prisma.TransactionClient,
  payload: ReservaCheckoutPayload['cliente']
) {
  const existing = await tx.cliente.findFirst({
    where: payload.email
      ? {
          email: payload.email,
        }
      : {
          nombre: payload.nombre,
          telefono: payload.telefono,
        },
    select: {
      id: true,
    },
  });

  if (existing) {
    return tx.cliente.update({
      where: { id: existing.id },
        data: {
          nombre: payload.nombre,
          telefono: payload.telefono,
          email: payload.email,
          documento: payload.documento,
        },
      });
  }

  return tx.cliente.create({
    data: {
      nombre: payload.nombre,
      telefono: payload.telefono,
      email: payload.email,
      documento: payload.documento,
    },
  });
}

async function fetchWompiTransaction(transactionId: string) {
  if (!env.wompiPublicKey) {
    throw new AppError('WOMPI_PUBLIC_KEY no esta configurado en el backend.', 500);
  }

  const response = await fetch(`${getWompiBaseUrl()}/transactions/${encodeURIComponent(transactionId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.wompiPublicKey}`,
    },
  });

  if (!response.ok) {
    throw new AppError(
      `No fue posible consultar la transaccion ${transactionId} en Wompi.`,
      response.status >= 400 && response.status < 500 ? 409 : 502
    );
  }

  const payload = (await response.json()) as {
    data?: Record<string, unknown>;
  };

  if (!payload.data || typeof payload.data !== 'object') {
    throw new AppError('Wompi respondio una transaccion invalida.', 502);
  }

  return payload.data;
}

export async function releaseExpiredPublicReservations() {
  const prisma = prismaClient();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const expiredBoletas = await tx.boleta.findMany({
      where: {
        estado: EstadoBoleta.RESERVADA,
        reservadaHasta: {
          lt: now,
        },
        rifaVendedor: {
          vendedor: {
            nombre: CANAL_WEB_VENDOR_NAME,
          },
        },
      },
      select: {
        id: true,
        ventaId: true,
      },
    });

    if (!expiredBoletas.length) {
      return 0;
    }

    const boletaIds = expiredBoletas.map((boleta) => boleta.id);
    const ventaIds = Array.from(
      new Set(
        expiredBoletas
          .map((boleta) => boleta.ventaId)
          .filter((value): value is string => Boolean(value))
      )
    );

    await tx.boleta.updateMany({
      where: {
        id: {
          in: boletaIds,
        },
      },
      data: {
        estado: EstadoBoleta.ASIGNADA,
        reservadaHasta: null,
        clienteId: null,
        ventaId: null,
      },
    });

    if (ventaIds.length) {
      await tx.venta.updateMany({
        where: {
          id: {
            in: ventaIds,
          },
          estado: EstadoVenta.PENDIENTE,
        },
        data: {
          estado: EstadoVenta.CANCELADA,
          pasarelaEstado: 'RESERVA_EXPIRADA',
        },
      });
    }

    return boletaIds.length;
  });
}

export async function createReservaCheckout(payload: ReservaCheckoutPayload) {
  const prisma = prismaClient();
  const now = new Date();
  const reservadaHasta = new Date(now.getTime() + RESERVA_TTL_MINUTES * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const relation = await tx.rifaVendedor.findFirst({
      where: {
        rifaId: payload.rifaId,
        vendedor: {
          nombre: CANAL_WEB_VENDOR_NAME,
        },
      },
      select: {
        id: true,
        rifaId: true,
      },
    });

    if (!relation) {
      throw new AppError(
        'La rifa no tiene configurado el canal de ventas de pagina web.',
        409
      );
    }

    const boletas = await tx.boleta.findMany({
      where: {
        id: {
          in: payload.boletaIds,
        },
        rifaId: payload.rifaId,
        rifaVendedorId: relation.id,
      },
      select: {
        id: true,
        numero: true,
        precio: true,
        estado: true,
      },
      orderBy: {
        numero: 'asc',
      },
    });

    if (boletas.length !== payload.boletaIds.length) {
      throw new AppError(
        'Una o varias boletas seleccionadas no pertenecen a esta rifa o no estan disponibles en el canal web.',
        404
      );
    }

    const unavailable = boletas.find((boleta) => boleta.estado !== EstadoBoleta.ASIGNADA);
    if (unavailable) {
      throw new AppError(
        `La boleta ${unavailable.numero} ya no esta disponible. Actualiza la pagina y vuelve a intentarlo.`,
        409
      );
    }

    const cliente = await upsertCliente(tx, payload.cliente);
    const total = boletas.reduce(
      (sum, boleta) => sum.plus(boleta.precio),
      new Prisma.Decimal(0)
    );

    const venta = await tx.venta.create({
      data: {
        clienteId: cliente.id,
        rifaId: payload.rifaId,
        estado: EstadoVenta.PENDIENTE,
        total,
        saldoPendiente: total,
        referenciaPago: buildReservaReferencia(),
        pasarelaPago: 'WOMPI_SANDBOX',
        pasarelaEstado: 'RESERVA_TEMPORAL',
      },
      select: {
        id: true,
        referenciaPago: true,
      },
    });

    await tx.boleta.updateMany({
      where: {
        id: {
          in: boletas.map((boleta) => boleta.id),
        },
      },
      data: {
        estado: EstadoBoleta.RESERVADA,
        reservadaHasta,
        clienteId: cliente.id,
        ventaId: venta.id,
      },
    });

    return {
      id: venta.id,
      referencia: venta.referenciaPago,
      expiresAt: reservadaHasta.toISOString(),
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        documento: payload.cliente.documento,
        email: cliente.email,
      },
      boletas: boletas.map((boleta) => ({
        id: boleta.id,
        numero: boleta.numero,
        precio: boleta.precio,
      })),
      total,
    };
  });
}

export async function prepareReservaWompiCheckout(reservaId: string) {
  const prisma = prismaClient();
  const now = new Date();

  if (!env.wompiPublicKey) {
    throw new AppError('WOMPI_PUBLIC_KEY no esta configurado en el backend.', 500);
  }

  if (!env.wompiRedirectUrl) {
    throw new AppError('WOMPI_REDIRECT_URL no esta configurado en el backend.', 500);
  }

  const venta = await prisma.venta.findUnique({
    where: {
      id: reservaId,
    },
    select: {
      id: true,
      rifaId: true,
      estado: true,
      total: true,
      referenciaPago: true,
      cliente: {
        select: {
          nombre: true,
          email: true,
          telefono: true,
        },
      },
      boletas: {
        select: {
          numero: true,
          estado: true,
          reservadaHasta: true,
        },
        orderBy: {
          numero: 'asc',
        },
      },
    },
  });

  if (!venta) {
    throw new AppError('La reserva no existe.', 404);
  }

  if (venta.estado !== EstadoVenta.PENDIENTE) {
    throw new AppError('La reserva ya no esta disponible para checkout.', 409);
  }

  if (!venta.referenciaPago) {
    throw new AppError('La reserva no tiene referencia de pago configurada.', 409);
  }

  if (!venta.boletas.length) {
    throw new AppError('La reserva no tiene boletas asociadas.', 409);
  }

  const expirationTime = venta.boletas.reduce<Date | null>((latest, boleta) => {
    if (!boleta.reservadaHasta) {
      return latest;
    }

    if (!latest || boleta.reservadaHasta < latest) {
      return boleta.reservadaHasta;
    }

    return latest;
  }, null);

  if (!expirationTime || expirationTime <= now) {
    throw new AppError('La reserva ya expiro. Selecciona las boletas nuevamente.', 409);
  }

  const invalidBoleta = venta.boletas.find((boleta) => boleta.estado !== EstadoBoleta.RESERVADA);
  if (invalidBoleta) {
    throw new AppError(
      `La boleta ${invalidBoleta.numero} ya no se encuentra reservada para este checkout.`,
      409
    );
  }

  const amountInCents = decimalToAmountInCents(venta.total);
  const expirationIso = expirationTime.toISOString();
  const currency = 'COP';
  const integritySource = buildWompiIntegritySource({
    reference: venta.referenciaPago,
    amountInCents,
    currency,
  });
  const integritySignature = buildWompiIntegritySignature({
    reference: venta.referenciaPago,
    amountInCents,
    currency,
  });

  const checkoutParams = new URLSearchParams({
    'public-key': env.wompiPublicKey,
    currency,
    'amount-in-cents': String(amountInCents),
    reference: venta.referenciaPago,
    'signature:integrity': integritySignature,
  });

  const checkoutUrl = `https://checkout.wompi.co/p/?${checkoutParams.toString()}`;

  return {
    reservaId: venta.id,
    reference: venta.referenciaPago,
    publicKey: env.wompiPublicKey,
    amountInCents,
    currency,
    expirationTime: expirationIso,
    integritySignature,
    integritySource,
    redirectUrl: `${env.wompiRedirectUrl}?reserva=${encodeURIComponent(venta.id)}&rifa=${encodeURIComponent(venta.rifaId)}&referencia=${encodeURIComponent(venta.referenciaPago)}`,
    checkoutUrl,
    wompiEnv: env.wompiEnv,
    customerData: {
      fullName: venta.cliente.nombre,
      phoneNumber: venta.cliente.telefono,
      email: venta.cliente.email,
    },
  };
}

export async function getReservaCheckoutStatus(reservaId: string) {
  const prisma = prismaClient();
  const now = new Date();

  const venta = await prisma.venta.findUnique({
    where: {
      id: reservaId,
    },
    select: {
      id: true,
      estado: true,
      total: true,
      referenciaPago: true,
      pasarelaPago: true,
      pasarelaEstado: true,
      pasarelaTransaccionId: true,
      cliente: {
        select: {
          nombre: true,
          email: true,
          telefono: true,
        },
      },
      boletas: {
        select: {
          id: true,
          numero: true,
          estado: true,
          reservadaHasta: true,
        },
        orderBy: {
          numero: 'asc',
        },
      },
    },
  });

  if (!venta) {
    throw new AppError('La reserva no existe.', 404);
  }

  const expirationTime = venta.boletas.reduce<Date | null>((latest, boleta) => {
    if (!boleta.reservadaHasta) {
      return latest;
    }

    if (!latest || boleta.reservadaHasta < latest) {
      return boleta.reservadaHasta;
    }

    return latest;
  }, null);

  const isExpired = Boolean(expirationTime && expirationTime <= now);
  const paymentState = venta.pasarelaEstado || 'RESERVA_TEMPORAL';

  return {
    id: venta.id,
    reference: venta.referenciaPago,
    estadoVenta: venta.estado,
    paymentState,
    paymentTransactionId: venta.pasarelaTransaccionId,
    expiresAt: expirationTime?.toISOString() || null,
    isExpired,
    total: venta.total,
    cliente: venta.cliente,
    boletas: venta.boletas,
  };
}

export async function processWompiWebhookEvent(body: Record<string, unknown>) {
  const shouldVerifySignature = body.skipSignatureVerification !== true;

  if (shouldVerifySignature) {
    const { providedChecksum, computedChecksum } = buildWompiEventChecksum(body);

    if (providedChecksum !== computedChecksum) {
      throw new AppError('La firma del webhook de Wompi no es valida.', 400);
    }
  }

  const event = body.event;
  if (event !== 'transaction.updated') {
    return { ignored: true, reason: 'unsupported_event' };
  }

  const data = body.data;
  const transaction =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>).transaction
      : null;

  if (!transaction || typeof transaction !== 'object') {
    throw new AppError('El webhook de Wompi no incluye transaction.', 400);
  }

  const transactionData = transaction as Record<string, unknown>;
  const reference = transactionData.reference;
  const status = transactionData.status;
  const transactionId = transactionData.id;

  if (typeof reference !== 'string' || !reference.trim()) {
    throw new AppError('El webhook de Wompi no incluye reference valida.', 400);
  }

  if (typeof status !== 'string' || !status.trim()) {
    throw new AppError('El webhook de Wompi no incluye status valido.', 400);
  }

  const prisma = prismaClient();
  const normalizedTransactionId =
    typeof transactionId === 'string' && transactionId.trim() ? transactionId : null;

  const result = await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: {
        referenciaPago: reference,
      },
      select: {
        id: true,
        clienteId: true,
        rifaId: true,
        estado: true,
        total: true,
        saldoPendiente: true,
        referenciaPago: true,
        pasarelaEstado: true,
        pasarelaTransaccionId: true,
        boletas: {
          select: {
            id: true,
            numero: true,
            estado: true,
            clienteId: true,
          },
        },
        pagos: {
          where: {
            metodoPago: MetodoPago.WOMPI,
          },
          select: {
            id: true,
            estado: true,
          },
          take: 1,
          orderBy: {
            fecha: 'desc',
          },
        },
      },
    });

    if (!venta) {
      return { ignored: true, reason: 'reservation_not_found', reference };
    }

    const commonVentaData: Prisma.VentaUpdateInput = {
      pasarelaPago: 'WOMPI',
      pasarelaEstado: status,
      pasarelaTransaccionId: normalizedTransactionId,
    };

    if (WOMPI_FINAL_APPROVED_STATES.has(status)) {
      const alreadyApproved =
        venta.estado === EstadoVenta.PAGADA &&
        venta.boletas.every((boleta) => boleta.estado === EstadoBoleta.PAGADA);

      if (!alreadyApproved) {
        await tx.venta.update({
          where: { id: venta.id },
          data: {
            ...commonVentaData,
            estado: EstadoVenta.PAGADA,
            saldoPendiente: new Prisma.Decimal(0),
          },
        });

        await tx.boleta.updateMany({
          where: {
            ventaId: venta.id,
          },
          data: {
            estado: EstadoBoleta.PAGADA,
            reservadaHasta: null,
            clienteId: venta.clienteId,
            ventaId: venta.id,
          },
        });
      } else {
        await tx.venta.update({
          where: { id: venta.id },
          data: commonVentaData,
        });
      }

      if (venta.pagos[0]) {
        await tx.pagoCliente.update({
          where: {
            id: venta.pagos[0].id,
          },
          data: {
            monto: venta.total,
            metodoPago: MetodoPago.WOMPI,
            estado: EstadoPago.CONFIRMADO,
          },
        });
      } else {
        await tx.pagoCliente.create({
          data: {
            ventaId: venta.id,
            monto: venta.total,
            metodoPago: MetodoPago.WOMPI,
            estado: EstadoPago.CONFIRMADO,
          },
        });
      }

      const pagoConfirmado = venta.pagos[0]
        ? await tx.pagoCliente.findUnique({
            where: {
              id: venta.pagos[0].id,
            },
            select: {
              id: true,
            },
          })
        : await tx.pagoCliente.findFirst({
            where: {
              ventaId: venta.id,
              metodoPago: MetodoPago.WOMPI,
            },
            select: {
              id: true,
            },
            orderBy: {
              fecha: 'desc',
            },
          });

      const cajaPrincipal = await tx.caja.findFirst({
        where: {
          rifaId: venta.rifaId,
        },
        select: {
          id: true,
        },
      });

      if (!cajaPrincipal) {
        throw new AppError('La rifa no tiene caja principal configurada.', 409);
      }

      let wompiSubCaja = await tx.subCaja.findFirst({
        where: {
          cajaId: cajaPrincipal.id,
          nombre: WOMPI_WEB_SUBCAJA,
        },
        select: {
          id: true,
        },
      });

      if (!wompiSubCaja) {
        wompiSubCaja = await tx.subCaja.create({
          data: {
            cajaId: cajaPrincipal.id,
            nombre: WOMPI_WEB_SUBCAJA,
            saldo: 0,
          },
          select: {
            id: true,
          },
        });
      }

      const existingMovement = pagoConfirmado
        ? await tx.movimientoCaja.findFirst({
            where: {
              pagoClienteId: pagoConfirmado.id,
              tipo: 'INGRESO',
            },
            select: {
              id: true,
            },
          })
        : null;

      if (pagoConfirmado && !existingMovement) {
        await Promise.all([
          tx.caja.update({
            where: {
              id: cajaPrincipal.id,
            },
            data: {
              saldo: {
                increment: venta.total,
              },
            },
          }),
          tx.subCaja.update({
            where: {
              id: wompiSubCaja.id,
            },
            data: {
              saldo: {
                increment: venta.total,
              },
            },
          }),
          tx.movimientoCaja.create({
            data: {
              tipo: 'INGRESO',
              valor: venta.total,
              descripcion: `Pago Wompi web aprobado para la reserva ${venta.referenciaPago}`,
              cajaId: cajaPrincipal.id,
              subCajaId: wompiSubCaja.id,
              rifaId: venta.rifaId,
              clienteId: venta.clienteId,
              ventaId: venta.id,
              pagoClienteId: pagoConfirmado.id,
            },
          }),
        ]);
      }

      return {
        ignored: false,
        reservaId: venta.id,
        reference,
        status,
        transactionId: normalizedTransactionId,
        finalized: 'approved',
      };
    }

    if (WOMPI_FINAL_REJECTED_STATES.has(status)) {
      const alreadyReleased =
        venta.estado === EstadoVenta.CANCELADA &&
        venta.boletas.every(
          (boleta) => boleta.estado === EstadoBoleta.ASIGNADA && !boleta.clienteId
        );

      if (!alreadyReleased) {
        await tx.venta.update({
          where: { id: venta.id },
          data: {
            ...commonVentaData,
            estado: EstadoVenta.CANCELADA,
          },
        });

        await tx.boleta.updateMany({
          where: {
            ventaId: venta.id,
          },
          data: {
            estado: EstadoBoleta.ASIGNADA,
            reservadaHasta: null,
            clienteId: null,
            ventaId: null,
          },
        });
      } else {
        await tx.venta.update({
          where: { id: venta.id },
          data: commonVentaData,
        });
      }

      if (venta.pagos[0]) {
        await tx.pagoCliente.update({
          where: {
            id: venta.pagos[0].id,
          },
          data: {
            monto: venta.total,
            metodoPago: MetodoPago.WOMPI,
            estado: EstadoPago.RECHAZADO,
          },
        });
      } else {
        await tx.pagoCliente.create({
          data: {
            ventaId: venta.id,
            monto: venta.total,
            metodoPago: MetodoPago.WOMPI,
            estado: EstadoPago.RECHAZADO,
          },
        });
      }

      return {
        ignored: false,
        reservaId: venta.id,
        reference,
        status,
        transactionId: normalizedTransactionId,
        finalized: 'rejected',
      };
    }

    await tx.venta.update({
      where: {
        id: venta.id,
      },
      data: commonVentaData,
    });

    return {
      ignored: false,
      reservaId: venta.id,
      reference,
      status,
      transactionId: normalizedTransactionId,
      finalized: 'pending',
    };
  });

  return result;
}

export async function reconcileWompiTransaction(
  reservaId: string,
  transactionId: string
) {
  const transaction = await fetchWompiTransaction(transactionId);
  const reference = transaction.reference;

  if (typeof reference !== 'string' || !reference.trim()) {
    throw new AppError('La transaccion consultada en Wompi no incluye una referencia valida.', 409);
  }

  const prisma = prismaClient();
  const venta = await prisma.venta.findUnique({
    where: {
      id: reservaId,
    },
    select: {
      id: true,
      referenciaPago: true,
    },
  });

  if (!venta) {
    throw new AppError('La reserva no existe.', 404);
  }

  if (!venta.referenciaPago || venta.referenciaPago !== reference) {
    throw new AppError(
      'La transaccion de Wompi no corresponde a la reserva consultada.',
      409
    );
  }

  return processWompiWebhookEvent({
    event: 'transaction.updated',
    data: {
      transaction,
    },
    signature: {
      checksum: 'reconciled',
      properties: [],
    },
    timestamp: Date.now(),
    skipSignatureVerification: true,
  });
}
