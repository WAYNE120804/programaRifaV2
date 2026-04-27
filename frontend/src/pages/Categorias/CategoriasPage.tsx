import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import FormModal from '../../components/common/FormModal';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';

const initialForm = {
  id: '',
  nombre: '',
  codigo: '',
  descripcion: '',
  orden: 0,
  activa: true,
};

const formatCategoryCode = (value: string) => {
  const normalized = value.replace(/\D+/g, '').slice(0, 2);

  if (!normalized) {
    return '';
  }

  return normalized.padStart(2, '0');
};

const CategoriasPage = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCategorias = async () => {
    const { data } = await client.get(endpoints.categorias(), {
      params: {
        search,
      },
    });
    setCategorias(data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadCategorias();
      } catch (requestError) {
        setPageError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const filteredCategorias = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return categorias;
    }

    return categorias.filter((item) =>
      [item.nombre, item.descripcion]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [categorias, search]);

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

  const handleEdit = (categoria: any) => {
    setForm({
      id: categoria.id,
      nombre: categoria.nombre || '',
      codigo: categoria.codigo || '',
      descripcion: categoria.descripcion || '',
      orden: Number(categoria.orden || 0),
      activa: Boolean(categoria.activa),
    });
    setSuccess(null);
    setModalError(null);
    setPageError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setModalError(null);
    setSuccess(null);

    try {
      const payload = {
        nombre: form.nombre,
        codigo: form.codigo,
        descripcion: form.descripcion,
        orden: Number(form.orden || 0),
        activa: form.activa,
      };

      if (form.id) {
        await client.put(endpoints.categoriaById(form.id), payload);
      } else {
        await client.post(endpoints.categorias(), payload);
      }

      await loadCategorias();
      closeModal();
      setSuccess(form.id ? 'Categoria actualizada.' : 'Categoria creada.');
    } catch (requestError) {
      setModalError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiva = async (categoria: any) => {
    setPageError(null);
    setSuccess(null);

    try {
      await client.patch(endpoints.categoriaActiva(categoria.id), {
        activa: !categoria.activa,
      });
      await loadCategorias();
      setSuccess(categoria.activa ? 'Categoria desactivada.' : 'Categoria activada.');
    } catch (requestError) {
      setPageError((requestError as Error).message);
    }
  };

  const columns = [
    { key: 'nombre', header: 'NOMBRE' },
    { key: 'codigo', header: 'CODIGO' },
    {
      key: 'descripcion',
      header: 'DESCRIPCION',
      render: (row: any) => row.descripcion || 'Sin descripcion',
    },
    {
      key: 'orden',
      header: 'ORDEN',
    },
    {
      key: 'productos',
      header: 'PRODUCTOS',
      render: (row: any) => row._count?.productos || 0,
    },
    {
      key: 'estado',
      header: 'ESTADO',
      render: (row: any) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            row.activa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {row.activa ? 'ACTIVA' : 'INACTIVA'}
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
            onClick={() => void handleToggleActiva(row)}
          >
            {row.activa ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Categorias" />
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
              <span className="text-slate-600">Buscar categoria</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o descripcion..."
              />
            </label>
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={openCreateModal}
            >
              Crear categoria
            </button>
          </div>
        </section>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          {loading ? (
            <Loading label="Cargando categorias..." />
          ) : filteredCategorias.length === 0 ? (
            <EmptyState title="Sin categorias" description="Crea la primera categoria para empezar." />
          ) : (
            <DataTable columns={columns} data={filteredCategorias} />
          )}
        </section>
      </div>
      <FormModal
        open={isModalOpen}
        title={form.id ? 'Editar categoria' : 'Crear categoria'}
        description="Registra o ajusta las categorias del inventario."
        onClose={closeModal}
      >
        <ErrorBanner message={modalError} />
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-600">Nombre</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.nombre}
              onChange={(event) =>
                setForm((current) => ({ ...current, nombre: event.target.value }))
              }
              required
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Codigo numerico</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.codigo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  codigo: event.target.value.replace(/\D+/g, '').slice(0, 2),
                }))
              }
              onBlur={() =>
                setForm((current) => ({
                  ...current,
                  codigo: formatCategoryCode(current.codigo),
                }))
              }
              placeholder="01"
              required
            />
            <span className="mt-1 block text-xs text-slate-500">
              Se usa para generar el codigo de barras por categoria.
            </span>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Orden</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.orden}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  orden: Number(event.target.value || 0),
                }))
              }
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-slate-600">Descripcion</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.descripcion}
              onChange={(event) =>
                setForm((current) => ({ ...current, descripcion: event.target.value }))
              }
            />
          </label>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(event) =>
                setForm((current) => ({ ...current, activa: event.target.checked }))
              }
            />
            <span>Categoria activa</span>
          </label>
          <div className="flex items-end gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
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

export default CategoriasPage;
