import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import FormModal from '../../components/common/FormModal';
import Loading from '../../components/common/Loading';
import MoneyInput from '../../components/common/MoneyInput';
import Topbar from '../../components/Layout/Topbar';
import { formatCOP } from '../../utils/money';

const paymentOptions = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'OTRO', label: 'Otro' },
];

const initialSaleForm = {
  metodoPago: 'EFECTIVO',
  valorRecibido: 0,
  observaciones: '',
};

const initialClientForm = {
  nombreCompleto: '',
  cedula: '',
  telefonoCelular: '',
  email: '',
  fechaNacimiento: '',
};

const GENERIC_CUSTOMER_DOCUMENT = '2222222';

const normalizeSearchValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatVariantDetail = (variant: {
  color?: string | null;
  talla?: string | null;
}) => {
  const color = String(variant.color || '').toUpperCase();
  const talla = String(variant.talla || '').toUpperCase();

  if (color === 'NO APLICA' && talla === 'NO APLICA') {
    return 'Sin color ni talla';
  }

  if (color === 'NO APLICA') {
    return `Talla ${variant.talla}`;
  }

  if (talla === 'NO APLICA') {
    return `Color ${variant.color}`;
  }

  return `${variant.color}/${variant.talla}`;
};

const formatClientBirthDate = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
};

const VentasPage = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<any[]>([]);
  const [variantes, setVariantes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saleForm, setSaleForm] = useState(initialSaleForm);
  const [variantSearch, setVariantSearch] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [items, setItems] = useState<
    Array<{
      varianteId: string;
      nombre: string;
      detalle: string;
      sku: string | null;
      codigoBarras: string | null;
      cantidad: number;
      stockActual: number;
      precioVenta: number;
      subtotal: number;
    }>
  >([]);

  const loadData = async () => {
    const [ventasRes, variantesRes, clientesRes] = await Promise.all([
      client.get(endpoints.ventas()),
      client.get(endpoints.productoVariantes()),
      client.get(endpoints.clientes()),
    ]);

    setVentas(ventasRes.data);
    setVariantes(variantesRes.data);
    setClientes(clientesRes.data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadData();
      } catch (requestError) {
        setPageError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const saleVariants = useMemo(
    () =>
      variantes.filter(
        (item) => item.estado !== 'INACTIVO' && Number(item.stockActual || 0) > 0
      ),
    [variantes]
  );

  const normalizedVariantSearch = normalizeSearchValue(variantSearch);
  const normalizedClientSearch = normalizeSearchValue(clientSearch);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const change = Math.max(0, saleForm.valorRecibido - subtotal);
  const selectedClient = clientes.find((item) => item.id === selectedClientId) || null;
  const genericClient =
    clientes.find((item) => String(item.cedula || '') === GENERIC_CUSTOMER_DOCUMENT) || null;

  useEffect(() => {
    if (saleForm.metodoPago !== 'EFECTIVO') {
      setSaleForm((current) =>
        current.valorRecibido === subtotal
          ? current
          : {
              ...current,
              valorRecibido: subtotal,
            }
      );
    }
  }, [saleForm.metodoPago, subtotal]);

  const filteredVariantResults = useMemo(() => {
    if (!normalizedVariantSearch) {
      return [];
    }

    return saleVariants
      .filter((item) => {
        const barcode = item.codigos?.find((code: any) => code.principal)?.codigo || '';
        const terms = [
          item.producto?.nombre || '',
          item.producto?.marca || '',
          item.sku || '',
          barcode,
          formatVariantDetail(item),
        ];

        return terms.some((term) => normalizeSearchValue(String(term)).includes(normalizedVariantSearch));
      })
      .slice(0, 8);
  }, [saleVariants, normalizedVariantSearch]);

  const filteredClientes = useMemo(() => {
    if (!normalizedClientSearch) {
      return [];
    }

    return clientes
      .filter((clientItem) =>
        [
          clientItem.nombreCompleto,
          clientItem.cedula,
          clientItem.telefonoCelular,
          clientItem.email,
        ]
          .filter(Boolean)
          .some((value) => normalizeSearchValue(String(value)).includes(normalizedClientSearch))
      )
      .slice(0, 6);
  }, [clientes, normalizedClientSearch]);

  const filteredVentas = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return ventas;
    }

    return ventas.filter((venta) =>
      [
        `#${venta.numero}`,
        venta.usuario?.nombre,
        venta.cliente?.nombreCompleto,
        venta.cliente?.cedula,
        venta.items
          ?.map(
            (item: any) =>
              `${item.variante?.producto?.nombre} ${item.variante?.sku || ''} ${item.variante?.codigos?.[0]?.codigo || ''} ${formatVariantDetail(item.variante || {})}`
          )
          .join(' '),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [ventas, search]);

  const resetForm = () => {
    setSaleForm(initialSaleForm);
    setVariantSearch('');
    setSelectedQuantity(1);
    setSelectedClientId('');
    setClientSearch('');
    setShowClientForm(false);
    setClientForm(initialClientForm);
    setItems([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setModalError(null);
    setPageError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const addVariantToSale = (variant: any) => {
    if (!variant) {
      setModalError('Debes escoger un producto valido.');
      return;
    }

    if (!Number.isFinite(selectedQuantity) || selectedQuantity <= 0) {
      setModalError('La cantidad debe ser mayor que cero.');
      return;
    }

    const nextQuantity = Math.trunc(selectedQuantity);
    const existingQuantity =
      items.find((item) => item.varianteId === variant.id)?.cantidad || 0;
    const totalQuantity = existingQuantity + nextQuantity;

    if (totalQuantity > Number(variant.stockActual || 0)) {
      setModalError(
        `No puedes vender mas de ${variant.stockActual} unidades de ${variant.producto?.nombre} (${formatVariantDetail(variant)}).`
      );
      return;
    }

    const barcode = variant.codigos?.find((code: any) => code.principal)?.codigo || null;

    setItems((current) => {
      const existingItem = current.find((item) => item.varianteId === variant.id);

      if (existingItem) {
        return current.map((item) =>
          item.varianteId === variant.id
            ? {
                ...item,
                cantidad: totalQuantity,
                subtotal: totalQuantity * Number(variant.precioVenta || 0),
              }
            : item
        );
      }

      return [
        ...current,
        {
          varianteId: variant.id,
          nombre: variant.producto?.nombre || 'Variante',
          detalle: formatVariantDetail(variant),
          sku: variant.sku || null,
          codigoBarras: barcode,
          cantidad: nextQuantity,
          stockActual: Number(variant.stockActual || 0),
          precioVenta: Number(variant.precioVenta || 0),
          subtotal: nextQuantity * Number(variant.precioVenta || 0),
        },
      ];
    });

    setModalError(null);
    setVariantSearch('');
    setSelectedQuantity(1);
  };

  const handleVariantSearchSubmit = () => {
    const searchTerm = normalizedVariantSearch;

    if (!searchTerm) {
      return;
    }

    const exactVariant = saleVariants.find((item) => {
      const barcode = item.codigos?.find((code: any) => code.principal)?.codigo || '';
      const exactTerms = [item.sku || '', item.producto?.nombre || '', barcode];

      return exactTerms.some((term) => normalizeSearchValue(String(term)) === searchTerm);
    });

    if (exactVariant) {
      addVariantToSale(exactVariant);
      return;
    }

    if (filteredVariantResults.length === 1) {
      addVariantToSale(filteredVariantResults[0]);
      return;
    }

    setModalError('Escribe un codigo/SKU completo o usa el boton Agregar del producto correcto.');
  };

  const handleRemoveItem = (varianteId: string) => {
    setItems((current) => current.filter((item) => item.varianteId !== varianteId));
  };

  const handleUpdateItemQuantity = (varianteId: string, rawValue: number) => {
    setItems((current) =>
      current.map((item) => {
        if (item.varianteId !== varianteId) {
          return item;
        }

        const quantity = Math.max(1, Math.min(item.stockActual, Math.trunc(rawValue || 1)));

        return {
          ...item,
          cantidad: quantity,
          subtotal: quantity * item.precioVenta,
        };
      })
    );
  };

  const handleMetodoPagoChange = (metodoPago: string) => {
    setSaleForm((current) => ({
      ...current,
      metodoPago,
      valorRecibido: metodoPago === 'EFECTIVO' ? current.valorRecibido : subtotal,
    }));
  };

  const createQuickClient = async () => {
    const { data } = await client.post(endpoints.clientes(), clientForm);
    setClientes((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== data.id);
      return [...withoutDuplicate, data].sort((left, right) =>
        String(left.nombreCompleto || '').localeCompare(String(right.nombreCompleto || ''), 'es')
      );
    });
    setSelectedClientId(data.id);
    setClientSearch(data.nombreCompleto);
    setShowClientForm(false);
    setClientForm(initialClientForm);

    return data;
  };

  const handleCreateQuickClient = async () => {
    setSavingClient(true);
    setModalError(null);

    try {
      await createQuickClient();
    } catch (requestError) {
      setModalError((requestError as Error).message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setModalError(null);
    setSuccess(null);

    try {
      if (items.length === 0) {
        throw new Error('Debes agregar al menos un producto a la venta.');
      }

      let clienteIdForSale = selectedClientId || null;

      if (
        !clienteIdForSale &&
        showClientForm &&
        [clientForm.nombreCompleto, clientForm.cedula, clientForm.telefonoCelular].some((value) =>
          String(value || '').trim()
        )
      ) {
        setSavingClient(true);
        const createdClient = await createQuickClient();
        clienteIdForSale = createdClient.id;
        setSavingClient(false);
      }

      const payload = {
        items: items.map((item) => ({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
        })),
        clienteId: clienteIdForSale,
        metodoPago: saleForm.metodoPago,
        valorRecibido: saleForm.valorRecibido,
        observaciones: saleForm.observaciones,
      };

      const { data } = await client.post(endpoints.ventas(), payload);

      await loadData();
      closeModal();
      setSuccess(`Venta #${data.numero} registrada por ${formatCOP(data.total)}.`);
      navigate(`/ventas/${data.id}/tirilla`);
    } catch (requestError) {
      setModalError((requestError as Error).message);
    } finally {
      setSaving(false);
      setSavingClient(false);
    }
  };

  const columns = [
    {
      key: 'numero',
      header: 'VENTA',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-slate-900">#{row.numero}</div>
          <div className="text-xs text-slate-500">
            {new Date(row.createdAt).toLocaleString('es-CO')}
          </div>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'CLIENTE',
      render: (row: any) =>
        row.cliente ? (
          <div>
            <div className="font-semibold text-slate-900">{row.cliente.nombreCompleto}</div>
            <div className="text-xs text-slate-500">{row.cliente.cedula}</div>
          </div>
        ) : (
          <div>
            <div className="font-semibold text-slate-900">CLIENTE GENERAL</div>
            <div className="text-xs text-slate-500">2222222</div>
          </div>
        ),
    },
    {
      key: 'productos',
      header: 'PRODUCTOS',
      render: (row: any) => (
        <div className="space-y-1">
          {row.items?.slice(0, 3).map((item: any) => (
            <div key={item.id} className="text-sm text-slate-700">
              {item.cantidad} x {item.variante?.producto?.nombre} {formatVariantDetail(item.variante || {})}
            </div>
          ))}
          {row.items?.length > 3 ? (
            <div className="text-xs text-slate-500">+{row.items.length - 3} mas</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'TOTAL',
      render: (row: any) => formatCOP(row.total),
    },
    {
      key: 'utilidadTotal',
      header: 'UTILIDAD',
      render: (row: any) => formatCOP(row.utilidadTotal),
    },
    {
      key: 'estado',
      header: 'ESTADO',
      render: (row: any) => (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {row.estado}
        </span>
      ),
    },
    {
      key: 'tirilla',
      header: 'TIRILLA',
      render: (row: any) => (
        <Link
          to={`/ventas/${row.id}/tirilla`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Ver tirilla
        </Link>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Ventas" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={pageError} />
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="block flex-1 text-sm">
              <span className="text-slate-600">Buscar venta</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Numero, cliente, cedula, producto o codigo..."
              />
            </label>
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={openCreateModal}
            >
              Registrar venta
            </button>
          </div>
        </section>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          {loading ? (
            <Loading label="Cargando ventas..." />
          ) : filteredVentas.length === 0 ? (
            <EmptyState title="Sin ventas" description="Registra la primera venta para empezar a probar caja e inventario." />
          ) : (
            <DataTable columns={columns} data={filteredVentas} />
          )}
        </section>
      </div>

      <FormModal
        open={isModalOpen}
        title="Registrar venta"
        description="Primero agrega los productos, luego selecciona o crea el cliente, y al final registra el pago."
        onClose={closeModal}
        size="2xl"
      >
        <ErrorBanner message={modalError} />
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">1. Productos</h3>
              <p className="text-sm text-slate-500">
                Busca por nombre, SKU o codigo de barras. Si el codigo es completo, `Enter` lo agrega de una vez.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
              <label className="text-sm">
                <span className="text-slate-600">Buscar producto</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={variantSearch}
                  onChange={(event) => {
                    setVariantSearch(event.target.value);
                    setModalError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleVariantSearchSubmit();
                    }
                  }}
                  placeholder="Nombre, SKU o codigo de barras..."
                  autoFocus
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-600">Cantidad</span>
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={selectedQuantity}
                  onChange={(event) => setSelectedQuantity(Number(event.target.value || 1))}
                />
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Coincidencias</h4>
                <span className="text-xs text-slate-500">
                  {variantSearch.trim()
                    ? `${filteredVariantResults.length} coincidencia${filteredVariantResults.length === 1 ? '' : 's'}`
                    : 'Escribe para buscar'}
                </span>
              </div>
              {filteredVariantResults.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {variantSearch.trim()
                    ? 'No hay productos que coincidan con esa busqueda.'
                    : 'Aun no has escrito nada para buscar productos.'}
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px_100px_140px_120px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-slate-600">
                    <div>Nombre</div>
                    <div>Categoria</div>
                    <div>Color</div>
                    <div>Talla</div>
                    <div>Stock</div>
                    <div>Precio</div>
                    <div>Accion</div>
                  </div>
                  {filteredVariantResults.map((variant: any) => {
                    const barcode = variant.codigos?.find((item: any) => item.principal)?.codigo;

                    return (
                      <div
                        key={variant.id}
                        className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px_100px_140px_120px] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{variant.producto?.nombre}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            SKU: {variant.sku || 'Sin SKU'} | Codigo: {barcode || 'Sin codigo'}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700">
                          {variant.producto?.categoria?.nombre || 'Sin categoria'}
                        </div>
                        <div className="text-sm text-slate-700">
                          {String(variant.color || '').toUpperCase() === 'NO APLICA' ? 'No aplica' : variant.color}
                        </div>
                        <div className="text-sm text-slate-700">
                          {String(variant.talla || '').toUpperCase() === 'NO APLICA' ? 'No aplica' : variant.talla}
                        </div>
                        <div className="text-sm text-slate-700">{variant.stockActual}</div>
                        <div className="text-base font-semibold text-slate-900">
                          {formatCOP(variant.precioVenta)}
                        </div>
                        <div className="flex justify-start">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                            onClick={() => addVariantToSale(variant)}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Productos agregados</h4>
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">Aun no has agregado productos a la venta.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.varianteId}
                      className="grid gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 md:grid-cols-[minmax(0,1fr)_130px_140px_auto]"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{item.nombre}</div>
                        <div className="text-xs text-slate-500">
                          {item.detalle} | SKU: {item.sku || 'Sin SKU'} | Codigo: {item.codigoBarras || 'Sin codigo'}
                        </div>
                      </div>
                      <label className="text-sm text-slate-700">
                        <span className="sr-only">Cantidad</span>
                        <input
                          type="number"
                          min="1"
                          max={item.stockActual}
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                          value={item.cantidad}
                          onChange={(event) =>
                            handleUpdateItemQuantity(item.varianteId, Number(event.target.value || 1))
                          }
                        />
                      </label>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatCOP(item.subtotal)}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm font-semibold text-rose-700 underline"
                          onClick={() => handleRemoveItem(item.varianteId)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">2. Cliente</h3>
              <p className="text-sm text-slate-500">
                Busca un cliente existente o crealo rapido sin salir del modal.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="text-sm">
                <span className="text-slate-600">Buscar cliente</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={clientSearch}
                  onChange={(event) => {
                    setClientSearch(event.target.value);
                    setModalError(null);
                  }}
                  placeholder="Nombre, cedula o telefono..."
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                  onClick={() => {
                    setSelectedClientId(genericClient?.id || '');
                    setClientSearch(genericClient?.nombreCompleto || '');
                  }}
                >
                  Usar cliente general
                </button>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                  onClick={() => setShowClientForm((current) => !current)}
                >
                  {showClientForm ? 'Ocultar formulario' : 'Crear cliente rapido'}
                </button>
              </div>
            </div>

            {selectedClient ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="font-semibold text-emerald-900">{selectedClient.nombreCompleto}</div>
                <div className="text-sm text-emerald-800">
                  Cedula: {selectedClient.cedula} | Telefono: {selectedClient.telefonoCelular}
                  {selectedClient.email ? ` | Correo: ${selectedClient.email}` : ''}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Si no eliges uno, la venta se guardara con el cliente general de cedula 2222222.
              </div>
            )}

            {filteredClientes.length > 0 ? (
              <div className="mt-4 space-y-2">
                {filteredClientes.map((clientItem) => (
                  <button
                    key={clientItem.id}
                    type="button"
                    className="grid w-full gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left md:grid-cols-[minmax(0,1fr)_auto]"
                    onClick={() => {
                      setSelectedClientId(clientItem.id);
                      setClientSearch(clientItem.nombreCompleto);
                      setShowClientForm(false);
                    }}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{clientItem.nombreCompleto}</div>
                      <div className="text-xs text-slate-500">
                        {clientItem.cedula} | {clientItem.telefonoCelular}
                        {clientItem.email ? ` | ${clientItem.email}` : ''}
                      </div>
                    </div>
                    <span className="rounded-md border border-slate-300 px-3 py-2 text-sm">Usar</span>
                  </button>
                ))}
              </div>
            ) : null}

            {showClientForm ? (
              <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <label className="text-sm md:col-span-2">
                  <span className="text-slate-600">Nombre completo</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={clientForm.nombreCompleto}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, nombreCompleto: event.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Cedula</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={clientForm.cedula}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, cedula: event.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Telefono celular</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={clientForm.telefonoCelular}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, telefonoCelular: event.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Correo electronico</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={clientForm.email}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Fecha de nacimiento</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={clientForm.fechaNacimiento}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, fechaNacimiento: event.target.value }))
                    }
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    disabled={savingClient}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                    onClick={() => void handleCreateQuickClient()}
                  >
                    {savingClient ? 'Guardando cliente...' : 'Guardar cliente y usarlo en la venta'}
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">3. Pago</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm">
                <span className="text-slate-600">Metodo de pago</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={saleForm.metodoPago}
                  onChange={(event) => handleMetodoPagoChange(event.target.value)}
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <MoneyInput
                label="Valor recibido"
                value={saleForm.valorRecibido}
                onChange={(value) => setSaleForm((current) => ({ ...current, valorRecibido: value }))}
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{formatCOP(subtotal)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Cambio</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{formatCOP(change)}</p>
              </div>
            </div>

            {saleForm.metodoPago !== 'EFECTIVO' ? (
              <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Para pagos diferentes a efectivo, el valor recibido se ajusta al total y no genera cambio.
              </div>
            ) : null}

            <label className="mt-4 block text-sm">
              <span className="text-slate-600">Observaciones</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                value={saleForm.observaciones}
                onChange={(event) =>
                  setSaleForm((current) => ({ ...current, observaciones: event.target.value }))
                }
              />
            </label>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || savingClient || items.length === 0}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving || savingClient ? 'Guardando...' : 'Confirmar venta'}
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm"
              onClick={closeModal}
            >
              Cancelar
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default VentasPage;
