import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import type { CategoriaPayload } from './categoria.schemas';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

export async function listCategorias(filters?: { search?: string; activa?: string }) {
  const search = filters?.search?.trim();
  const activaFilter =
    filters?.activa === 'true' ? true : filters?.activa === 'false' ? false : undefined;

  return prismaClient().categoriaProducto.findMany({
    where: {
      ...(typeof activaFilter === 'boolean' ? { activa: activaFilter } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { codigo: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          productos: true,
        },
      },
    },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  });
}

export async function getCategoriaById(id: string) {
  const categoria = await prismaClient().categoriaProducto.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          productos: true,
        },
      },
    },
  });

  if (!categoria) {
    throw new AppError('La categoria no existe.', 404);
  }

  return categoria;
}

export async function createCategoria(payload: CategoriaPayload) {
  const prisma = prismaClient();
  const existing = await prisma.categoriaProducto.findUnique({
    where: { nombre: payload.nombre },
    select: { id: true },
  });

  if (existing) {
    throw new AppError('Ya existe una categoria con ese nombre.', 409);
  }

  const duplicateCode = await prisma.categoriaProducto.findFirst({
    where: { codigo: payload.codigo },
    select: { id: true },
  });

  if (duplicateCode) {
    throw new AppError('Ya existe una categoria con ese codigo.', 409);
  }

  return prisma.categoriaProducto.create({
    data: payload,
    include: {
      _count: {
        select: {
          productos: true,
        },
      },
    },
  });
}

export async function updateCategoria(id: string, payload: CategoriaPayload) {
  const prisma = prismaClient();
  await getCategoriaById(id);

  const duplicate = await prisma.categoriaProducto.findFirst({
    where: {
      nombre: payload.nombre,
      NOT: { id },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError('Ya existe otra categoria con ese nombre.', 409);
  }

  const duplicateCode = await prisma.categoriaProducto.findFirst({
    where: {
      codigo: payload.codigo,
      NOT: { id },
    },
    select: { id: true },
  });

  if (duplicateCode) {
    throw new AppError('Ya existe otra categoria con ese codigo.', 409);
  }

  return prisma.categoriaProducto.update({
    where: { id },
    data: payload,
    include: {
      _count: {
        select: {
          productos: true,
        },
      },
    },
  });
}

export async function toggleCategoriaActiva(id: string, activa: boolean) {
  await getCategoriaById(id);

  return prismaClient().categoriaProducto.update({
    where: { id },
    data: { activa },
    include: {
      _count: {
        select: {
          productos: true,
        },
      },
    },
  });
}
