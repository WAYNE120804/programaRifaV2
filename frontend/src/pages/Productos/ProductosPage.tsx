import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import FormModal from '../../components/common/FormModal';
import Loading from '../../components/common/Loading';
import MoneyInput from '../../components/common/MoneyInput';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { formatCOP } from '../../utils/money';

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const NOT_APPLICABLE = 'NO APLICA';

const initialVariant = () => ({
  id: '',
  color: '',
  colorNoAplica: false,
  talla: '',
  tallaMode: 'LETTER',
  sku: '',
  codigoBarras: '',
  costoPromedio: 0,
  precioVenta: 0,
  stockActual: 0,
  stockMinimo: 0,
  estado: 'ACTIVO',
  permiteDecimal: false,
});

const initialForm = {
  id: '',
  categoriaId: '',
  nombre: '',
  descripcion: '',
  marca: '',
  genero: 'UNISEX',
  estado: 'ACTIVO',
  imagenUrl: '',
  notas: '',
  variantes: [initialVariant()],
};

const normalizeSkuToken = (value: string, fallback: string, maxLength: number) => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return (normalized || fallback).slice(0, maxLength);
};

const buildSkuPreview = (input: {
  categoriaNombre?: string;
  marca?: string;
  color?: string;
  talla?: string;
  currentSku?: string;
}) => {
  if (input.currentSku) {
    return input.currentSku;
  }

  const categoria = normalizeSkuToken(input.categoriaNombre || '', 'CAT', 3);
  const marca = normalizeSkuToken(input.marca || '', 'GEN', 3);
  const color = normalizeSkuToken(
    (input.color || '').toUpperCase() === NOT_APPLICABLE ? '' : input.color || '',
    'STD',
    3
  );
  const talla = normalizeSkuToken(
    (input.talla || '').toUpperCase() === NOT_APPLICABLE ? '' : input.talla || '',
    'U',
    4
  );

  return `${categoria}-${marca}-${color}-${talla}-###`;
};

const buildBarcodePreview = (categoryCode?: string) => {
  const prefix = (categoryCode || '').replace(/\D+/g, '').slice(0, 2);
  return prefix ? `${prefix}000001X` : 'CC000001X';
};

const detectTallaMode = (talla: string) => {
  const normalized = (talla || '').toUpperCase();

  if (normalized === NOT_APPLICABLE) {
    return 'NO_APLICA';
  }

  return LETTER_SIZES.includes(normalized) ? 'LETTER' : 'NUMERIC';
};

const isSimpleVariant = (variant: any) =>
  (variant?.color || '').toUpperCase() === NOT_APPLICABLE &&
  (variant?.talla || '').toUpperCase() === NOT_APPLICABLE;

const formatVariantSummary = (variant: any) => {
  const color = (variant?.color || '').toUpperCase();
  const talla = (variant?.talla || '').toUpperCase();

  if (color === NOT_APPLICABLE && talla === NOT_APPLICABLE) {
    return 'Sin color ni talla';
  }

  if (color === NOT_APPLICABLE) {
    return `Talla ${variant.talla}`;
  }

  if (talla === NOT_APPLICABLE) {
    return `Color ${variant.color}`;
  }

  return `${variant.color} / ${variant.talla}`;
};

const ProductosPage = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');

  const categoriaOptions = useMemo(
    () =>
      categorias
        .filter((item) => item.activa)
        .map((item) => ({
          value: item.id,
          label: `${item.codigo || '--'} - ${item.nombre}`,
        })),
    [categorias]
  );

  const loadData = async () => {
    const [productosRes, categoriasRes] = await Promise.all([
      client.get(endpoints.productos()),
      client.get(endpoints.categorias()),
    ]);

    setProductos(productosRes.data);
    setCategorias(categoriasRes.data);
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

  const filteredProductos = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return productos.filter((item) => {
      const matchesSearch = normalized
        ? [
            item.nombre,
            item.marca,
            item.categoria?.nombre,
            item.variantes?.map((variant: any) => `${variant.sku} ${variant.color} ${variant.talla}`).join(' '),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized))
        : true;

      const matchesCategoria = selectedCategoriaId ? item.categoriaId === selectedCategoriaId : true;
      const matchesEstado = selectedEstado ? item.estado === selectedEstado : true;

      return matchesSearch && matchesCategoria && matchesEstado;
    });
  }, [productos, search, selectedCategoriaId, selectedEstado]);

  const resetForm = () => {
    setForm(initialForm);
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

  const handleEdit = (producto: any) => {
    setForm({
      id: producto.id,
      categoriaId: producto.categoriaId || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      marca: producto.marca || '',
      genero: producto.genero || 'UNISEX',
      estado: producto.estado || 'ACTIVO',
      imagenUrl: producto.imagenUrl || '',
      notas: producto.notas || '',
      variantes:
        producto.variantes?.length > 0
            ? producto.variantes.map((variant: any) => ({
              id: variant.id,
              color: isSimpleVariant(variant) ? '' : variant.color || '',
              colorNoAplica: (variant.color || '').toUpperCase() === NOT_APPLICABLE,
              talla: variant.talla || '',
              tallaMode: detectTallaMode(variant.talla || ''),
              costoPromedio: Number(variant.costoPromedio || 0),
              precioVenta: Number(variant.precioVenta || 0),
              stockActual: Number(variant.stockActual || 0),
              stockMinimo: Number(variant.stockMinimo || 0),
              estado: variant.estado || 'ACTIVO',
              permiteDecimal: Boolean(variant.permiteDecimal),
              sku: variant.sku || '',
              codigoBarras: variant.codigos?.find((item: any) => item.principal)?.codigo || '',
            }))
          : [initialVariant()],
    });
    setModalError(null);
    setPageError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const updateVariant = (index: number, updater: (current: any) => any) => {
    setForm((current) => ({
      ...current,
      variantes: current.variantes.map((variant, variantIndex) =>
        variantIndex === index ? updater(variant) : variant
      ),
    }));
  };

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variantes: [...current.variantes, initialVariant()],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((current) => {
      const target = current.variantes[index];

      if (target?.id) {
        setModalError('Las variantes ya creadas no se eliminan desde aqui. Puedes inactivarlas o dejarlas en cero.');
        return current;
      }

      if (current.variantes.length === 1) {
        return current;
      }

      return {
        ...current,
        variantes: current.variantes.filter((_, variantIndex) => variantIndex !== index),
      };
    });
  };

  const selectedCategoria = categorias.find((item) => item.id === form.categoriaId);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setModalError(null);
    setSuccess(null);

    try {
      const payload = {
        id: form.id,
        categoriaId: form.categoriaId,
        categoriaCodigo: selectedCategoria?.codigo || null,
        nombre: form.nombre,
        descripcion: form.descripcion,
        marca: form.marca,
        genero: form.genero,
        usaVariantes: true,
        estado: form.estado,
        imagenUrl: form.imagenUrl,
        notas: form.notas,
        variantes: form.variantes.map((variant) => ({
          id: variant.id || null,
          color: variant.colorNoAplica ? NOT_APPLICABLE : variant.color,
          talla:
            variant.tallaMode === 'NO_APLICA'
              ? NOT_APPLICABLE
              : variant.tallaMode === 'LETTER'
                ? String(variant.talla || '').toUpperCase()
                : String(variant.talla || '').replace(/\D+/g, ''),
          costoPromedio: variant.costoPromedio,
          precioVenta: variant.precioVenta,
          stockActual: variant.stockActual,
          stockMinimo: variant.stockMinimo,
          estado: variant.estado,
          permiteDecimal: variant.permiteDecimal,
        })),
      };

      if (form.id) {
        await client.put(endpoints.productoById(form.id), payload);
      } else {
        await client.post(endpoints.productos(), payload);
      }

      await loadData();
      closeModal();
      setSuccess(form.id ? 'Producto actualizado.' : 'Producto creado.');
    } catch (requestError) {
      setModalError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (producto: any) => {
    setPageError(null);
    setSuccess(null);

    try {
      const nextEstado = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

      await client.patch(endpoints.productoEstado(producto.id), {
        estado: nextEstado,
      });
      await loadData();
      setSuccess('Estado del producto actualizado.');
    } catch (requestError) {
      setPageError((requestError as Error).message);
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'PRODUCTO',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-slate-900">{row.nombre}</div>
          <div className="text-xs text-slate-500">{row.marca || 'Sin marca'}</div>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'CATEGORIA',
      render: (row: any) => row.categoria?.nombre || 'Sin categoria',
    },
    {
          key: 'variantes',
      header: 'VARIANTES',
      render: (row: any) => (
        <div className="space-y-1">
          {row.variantes?.slice(0, 3).map((variant: any) => (
            <div key={variant.id} className="text-sm text-slate-700">
              {formatVariantSummary(variant)} | {variant.sku}
            </div>
          ))}
          {row.variantes?.length > 3 ? (
            <div className="text-xs text-slate-500">+{row.variantes.length - 3} variantes</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'STOCK TOTAL',
      render: (row: any) => row.stockTotal || 0,
    },
    {
      key: 'estado',
      header: 'ESTADO',
      render: (row: any) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            row.estado === 'ACTIVO'
              ? 'bg-emerald-100 text-emerald-700'
              : row.estado === 'AGOTADO'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-700'
          }`}
        >
          {row.estado}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: any) => (
        <div className="flex gap-3">
          <button
            type="button"
            className="text-sm font-semibold text-slate-700 underline"
            onClick={() => handleEdit(row)}
          >
            Editar
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-slate-700 underline"
            onClick={() => void handleToggleEstado(row)}
          >
            {row.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Productos" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={pageError} />
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px_200px]">
            <label className="text-sm">
              <span className="text-slate-600">Buscar producto o variante</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, marca, SKU, color o talla..."
              />
            </label>
            <div>
              <span className="text-sm text-slate-600">Filtrar por categoria</span>
              <div className="mt-1">
                <SearchableSelect
                  options={categoriaOptions}
                  value={selectedCategoriaId}
                  onChange={setSelectedCategoriaId}
                  placeholder="Todas las categorias"
                  clearable
                />
              </div>
            </div>
            <label className="text-sm">
              <span className="text-slate-600">Estado</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={selectedEstado}
                onChange={(event) => setSelectedEstado(event.target.value)}
              >
                <option value="">Todos</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="AGOTADO">AGOTADO</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={openCreateModal}
              >
                Crear producto
              </button>
            </div>
          </div>
        </section>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          {loading ? (
            <Loading label="Cargando productos..." />
          ) : filteredProductos.length === 0 ? (
            <EmptyState title="Sin productos" description="Crea el primer producto con sus variantes para empezar." />
          ) : (
            <DataTable columns={columns} data={filteredProductos} />
          )}
        </section>
      </div>

      <FormModal
        open={isModalOpen}
        title={form.id ? 'Editar producto' : 'Crear producto'}
        description="Registra la referencia base y luego sus variantes por color y talla."
        onClose={closeModal}
        size="2xl"
      >
        <ErrorBanner message={modalError} />
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <span className="text-sm text-slate-600">Categoria</span>
              <div className="mt-1">
                <SearchableSelect
                  options={categoriaOptions}
                  value={form.categoriaId}
                  onChange={(value) => setForm((current) => ({ ...current, categoriaId: value }))}
                  placeholder="Selecciona una categoria..."
                />
              </div>
            </div>
            <label className="text-sm">
              <span className="text-slate-600">Nombre de referencia</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.nombre}
                onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Marca</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.marca}
                onChange={(event) => setForm((current) => ({ ...current, marca: event.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Genero</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.genero}
                onChange={(event) => setForm((current) => ({ ...current, genero: event.target.value }))}
              >
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMENINO">FEMENINO</option>
                <option value="UNISEX">UNISEX</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2 xl:col-span-3">
              <span className="text-slate-600">Descripcion</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.descripcion}
                onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
              />
            </label>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Variantes</h3>
                <p className="text-sm text-slate-500">
                  Cada variante lleva su propio color, talla, stock, precio, SKU y codigo de barras.
                  Usa `NO APLICA` solo en el campo que no corresponda.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={addVariant}
              >
                Agregar variante
              </button>
            </div>

            {form.variantes.map((variant, index) => {
              const skuPreview = buildSkuPreview({
                categoriaNombre: selectedCategoria?.nombre,
                marca: form.marca,
                color: variant.color,
                talla: variant.talla,
                currentSku: variant.sku,
              });
              const barcodePreview = variant.codigoBarras || buildBarcodePreview(selectedCategoria?.codigo);

              return (
                <div key={variant.id || `new-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Variante {index + 1}</h4>
                    {form.variantes.length > 1 ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-rose-700 underline"
                        onClick={() => removeVariant(index)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="text-sm">
                      <span className="text-slate-600">Color</span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
                        value={variant.color}
                        onChange={(event) =>
                          updateVariant(index, (current) => ({ ...current, color: event.target.value }))
                        }
                        required={!variant.colorNoAplica}
                        disabled={variant.colorNoAplica}
                        placeholder={variant.colorNoAplica ? NOT_APPLICABLE : 'Escribe el color'}
                      />
                      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={variant.colorNoAplica}
                          onChange={(event) =>
                            updateVariant(index, (current) => ({
                              ...current,
                              colorNoAplica: event.target.checked,
                              color: event.target.checked ? '' : current.color,
                            }))
                          }
                        />
                        <span>NO APLICA</span>
                      </label>
                    </label>

                    <label className="text-sm">
                      <span className="text-slate-600">Tipo de talla</span>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={variant.tallaMode}
                        onChange={(event) =>
                          updateVariant(index, (current) => ({
                            ...current,
                            tallaMode: event.target.value,
                            talla: '',
                          }))
                        }
                      >
                        <option value="LETTER">Letras</option>
                        <option value="NUMERIC">Numerica</option>
                        <option value="NO_APLICA">NO APLICA</option>
                      </select>
                    </label>

                    {variant.tallaMode === 'LETTER' ? (
                      <label className="text-sm">
                        <span className="text-slate-600">Talla</span>
                        <select
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                          value={variant.talla}
                          onChange={(event) =>
                            updateVariant(index, (current) => ({
                              ...current,
                              talla: event.target.value.toUpperCase(),
                            }))
                          }
                          required
                        >
                          <option value="">Selecciona...</option>
                          {LETTER_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : variant.tallaMode === 'NUMERIC' ? (
                      <label className="text-sm">
                        <span className="text-slate-600">Talla numerica</span>
                        <input
                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                          value={variant.talla}
                          onChange={(event) =>
                            updateVariant(index, (current) => ({
                              ...current,
                              talla: event.target.value.replace(/\D+/g, ''),
                            }))
                          }
                          placeholder="28"
                          required
                        />
                      </label>
                    ) : (
                      <label className="text-sm">
                        <span className="text-slate-600">Talla</span>
                        <input
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-600"
                          value={NOT_APPLICABLE}
                          readOnly
                        />
                      </label>
                    )}

                    <label className="text-sm">
                      <span className="text-slate-600">SKU</span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-600"
                        value={skuPreview}
                        readOnly
                      />
                    </label>

                    <label className="text-sm">
                      <span className="text-slate-600">Codigo de barras</span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-600"
                        value={barcodePreview}
                        readOnly
                      />
                    </label>

                    <label className="text-sm">
                      <span className="text-slate-600">Stock actual</span>
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={variant.stockActual}
                        onChange={(event) =>
                          updateVariant(index, (current) => ({
                            ...current,
                            stockActual: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </label>

                    <label className="text-sm">
                      <span className="text-slate-600">Stock minimo</span>
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={variant.stockMinimo}
                        onChange={(event) =>
                          updateVariant(index, (current) => ({
                            ...current,
                            stockMinimo: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </label>

                    <MoneyInput
                      label="Costo promedio"
                      value={variant.costoPromedio}
                      onChange={(value) =>
                        updateVariant(index, (current) => ({ ...current, costoPromedio: value }))
                      }
                    />

                    <MoneyInput
                      label="Precio de venta"
                      value={variant.precioVenta}
                      onChange={(value) =>
                        updateVariant(index, (current) => ({ ...current, precioVenta: value }))
                      }
                    />

                    <label className="text-sm">
                      <span className="text-slate-600">Estado</span>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={variant.estado}
                        onChange={(event) =>
                          updateVariant(index, (current) => ({ ...current, estado: event.target.value }))
                        }
                      >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                        <option value="AGOTADO">AGOTADO</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={variant.permiteDecimal}
                        onChange={(event) =>
                          updateVariant(index, (current) => ({
                            ...current,
                            permiteDecimal: event.target.checked,
                          }))
                        }
                      />
                      <span>Permite cantidades decimales</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </section>

          <label className="block text-sm">
            <span className="text-slate-600">Notas</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.notas}
              onChange={(event) => setForm((current) => ({ ...current, notas: event.target.value }))}
            />
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={saving || !form.categoriaId}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving ? 'Guardando...' : form.id ? 'Actualizar' : 'Crear'}
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

export default ProductosPage;
