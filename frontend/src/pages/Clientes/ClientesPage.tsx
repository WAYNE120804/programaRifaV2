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
  nombreCompleto: '',
  cedula: '',
  telefonoCelular: '',
  email: '',
  fechaNacimiento: '',
};

const formatDateInput = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
};

const ClientesPage = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    const { data } = await client.get(endpoints.clientes());
    setClientes(data);
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

  const filteredClientes = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return clientes;
    }

    return clientes.filter((clienteItem) =>
      [
        clienteItem.nombreCompleto,
        clienteItem.cedula,
        clienteItem.telefonoCelular,
        clienteItem.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [clientes, search]);

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

  const handleEdit = (clienteItem: any) => {
    setForm({
      id: clienteItem.id,
      nombreCompleto: clienteItem.nombreCompleto || '',
      cedula: clienteItem.cedula || '',
      telefonoCelular: clienteItem.telefonoCelular || '',
      email: clienteItem.email || '',
      fechaNacimiento: formatDateInput(clienteItem.fechaNacimiento),
    });
    setModalError(null);
    setPageError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setModalError(null);
    setSuccess(null);

    try {
      const payload = {
        nombreCompleto: form.nombreCompleto,
        cedula: form.cedula,
        telefonoCelular: form.telefonoCelular,
        email: form.email,
        fechaNacimiento: form.fechaNacimiento,
      };

      if (form.id) {
        await client.put(endpoints.clienteById(form.id), payload);
      } else {
        await client.post(endpoints.clientes(), payload);
      }

      await loadData();
      closeModal();
      setSuccess(form.id ? 'Cliente actualizado.' : 'Cliente creado.');
    } catch (requestError) {
      setModalError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'nombreCompleto',
      header: 'CLIENTE',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-slate-900">{row.nombreCompleto}</div>
          <div className="text-xs text-slate-500">
            {row.email || 'Sin correo'}
          </div>
        </div>
      ),
    },
    {
      key: 'cedula',
      header: 'CEDULA',
      render: (row: any) => row.cedula,
    },
    {
      key: 'telefonoCelular',
      header: 'TELEFONO',
      render: (row: any) => row.telefonoCelular,
    },
    {
      key: 'fechaNacimiento',
      header: 'CUMPLEANOS',
      render: (row: any) =>
        row.fechaNacimiento
          ? new Date(row.fechaNacimiento).toLocaleDateString('es-CO')
          : 'No registrado',
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: any) => (
        <button
          type="button"
          className="text-sm font-semibold text-slate-700 underline"
          onClick={() => handleEdit(row)}
        >
          Editar
        </button>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Clientes" />
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
              <span className="text-slate-600">Buscar cliente</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, cedula, telefono o correo..."
              />
            </label>
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={openCreateModal}
            >
              Crear cliente
            </button>
          </div>
        </section>

        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          {loading ? (
            <Loading label="Cargando clientes..." />
          ) : filteredClientes.length === 0 ? (
            <EmptyState title="Sin clientes" description="Crea el primer cliente para empezar a asociar ventas, separados y creditos." />
          ) : (
            <DataTable columns={columns} data={filteredClientes} />
          )}
        </section>
      </div>

      <FormModal
        open={isModalOpen}
        title={form.id ? 'Editar cliente' : 'Crear cliente'}
        description="Registra los datos basicos del cliente."
        onClose={closeModal}
        size="xl"
      >
        <ErrorBanner message={modalError} />
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="text-slate-600">Nombre completo</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.nombreCompleto}
              onChange={(event) => setForm((current) => ({ ...current, nombreCompleto: event.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Cedula</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.cedula}
              onChange={(event) => setForm((current) => ({ ...current, cedula: event.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Telefono celular</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.telefonoCelular}
              onChange={(event) =>
                setForm((current) => ({ ...current, telefonoCelular: event.target.value }))
              }
              required
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Correo electronico</span>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Fecha de nacimiento</span>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.fechaNacimiento}
              onChange={(event) =>
                setForm((current) => ({ ...current, fechaNacimiento: event.target.value }))
              }
            />
          </label>
          <div className="flex gap-3 md:col-span-2">
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

export default ClientesPage;
