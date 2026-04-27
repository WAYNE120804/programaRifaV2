import { RolUsuario } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';

type LoginInput = {
  email?: unknown;
  identificador?: unknown;
  password?: unknown;
};

type UsuarioInput = {
  nombre?: unknown;
  email?: unknown;
  password?: unknown;
  rol?: unknown;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type UsuarioPayload = {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parsePassword(value: unknown) {
  const password = parseRequiredString(value, 'password');

  if (password.length < 8) {
    throw new AppError('La contrasena debe tener minimo 8 caracteres.');
  }

  return password;
}

function parseRol(value: unknown) {
  if (typeof value !== 'string' || !(value in RolUsuario)) {
    throw new AppError('El rol seleccionado no es valido.');
  }

  return value as RolUsuario;
}

export function parseLoginPayload(input: LoginInput): LoginPayload {
  return {
    identifier: parseRequiredString(input.identificador ?? input.email, 'identificador'),
    password: parseRequiredString(input.password, 'password'),
  };
}

export function parseUsuarioPayload(input: UsuarioInput): UsuarioPayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    email: parseRequiredString(input.email, 'email'),
    password: parsePassword(input.password),
    rol: parseRol(input.rol),
  };
}
