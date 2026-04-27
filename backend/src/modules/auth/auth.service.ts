import { env } from '../../config/env';
import { createAuthToken } from '../../lib/auth-token';
import { AppError } from '../../lib/app-error';
import { hashPassword, verifyPassword } from '../../lib/password';
import { RolUsuario } from '../../lib/prisma-client';
import { getPrisma } from '../../lib/prisma';
import type { LoginPayload, UsuarioPayload } from './auth.schemas';
import { normalizeLoginIdentifier } from './auth.utils';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function serializeUser(usuario: {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
}

export async function ensureBootstrapAdmin() {
  const prisma = prismaClient();
  const usersCount = await prisma.usuario.count();

  if (usersCount > 0) {
    return;
  }

  await prisma.usuario.create({
    data: {
      nombre: env.bootstrapAdminName,
      email: normalizeLoginIdentifier(env.bootstrapAdminEmail),
      password: hashPassword(env.bootstrapAdminPassword),
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });
}

export async function loginUsuario(payload: LoginPayload) {
  const prisma = prismaClient();
  const usuario = await prisma.usuario.findUnique({
    where: { email: normalizeLoginIdentifier(payload.identifier) },
  });

  if (!usuario || !verifyPassword(payload.password, usuario.password)) {
    throw new AppError('Documento, correo o contrasena incorrectos.', 401, {
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  if (!usuario.activo) {
    throw new AppError('Tu usuario esta inactivo.', 403, {
      errorCode: 'USER_DISABLED',
    });
  }

  return {
    token: createAuthToken({
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    }),
    usuario: serializeUser(usuario),
  };
}

export async function getAuthProfile(userId: string) {
  const usuario = await prismaClient().usuario.findUnique({
    where: { id: userId },
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  return serializeUser(usuario);
}

export async function listUsuarios() {
  const usuarios = await prismaClient().usuario.findMany({
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
  });

  return usuarios.map(serializeUser);
}

export async function createUsuario(payload: UsuarioPayload) {
  const prisma = prismaClient();
  const existing = await prisma.usuario.findUnique({
    where: { email: normalizeLoginIdentifier(payload.email) },
    select: { id: true },
  });

  if (existing) {
    throw new AppError('Ya existe un usuario con ese identificador.', 409, {
      errorCode: 'EMAIL_IN_USE',
    });
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombre: payload.nombre,
      email: normalizeLoginIdentifier(payload.email),
      password: hashPassword(payload.password),
      rol: payload.rol,
      activo: true,
    },
  });

  return serializeUser(usuario);
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  const prisma = prismaClient();
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  const totalAdminsActivos = await prisma.usuario.count({
    where: {
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });

  if (usuario.rol === RolUsuario.ADMIN && usuario.activo && !activo && totalAdminsActivos <= 1) {
    throw new AppError('No puedes desactivar el ultimo administrador activo.', 409, {
      errorCode: 'LAST_ADMIN',
    });
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: { activo },
  });

  return serializeUser(updated);
}
