import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import MoneyInput from '../../components/common/MoneyInput';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const initialForm = {
  nombre: '',
  descripcion: '',
  tipo: 'ANTICIPADO',
  mostrarValor: false,
  valor: '',
  fecha: '',
};

function numbersToText(boletas: Array<{ boleta?: { numero?: string } }>) {
  return boletas.map((item) => item.boleta?.numero).filter(Boolean).join(', ');
}

function parseNumbers(rawValue: string) {
  const matches = rawValue.match(/\d+/g);
  return matches ? [...new Set(matches)] : [];
}

const RifaPremiosPage = () => {
  const { id } = useParams();
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: null as string | null,
    success: '',
    rifa: null as any,
    premios: [] as any[],
    editing: null as any,
    deleteId: null as string | null,
  });
  const [form, setForm] = useState(initialForm);
  const [boletasPorPremio, setBoletasPorPremio] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (!id) {
      return;
    }

    try {
      const [rifaRes, premiosRes] = await Promise.all([
        client.get(endpoints.rifaById(id)),
        client.get(endpoints.premios(), { params: { rifaId: id } }),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        rifa: rifaRes.data,
        premios: premiosRes.data,
        error: null,
      }));

      setBoletasPorPremio(
        Object.fromEntries(
          premiosRes.data.map((premio: any) => [premio.id, numbersToText(premio.boletas)])
        )
      );
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  useEffect(() => {
    if (!state.editing) {
      setForm(initialForm);
      return;
    }

    setForm({
      nombre: state.editing.nombre || '',
      descripcion: state.editing.descripcion || '',
      tipo: state.editing.tipo || 'ANTICIPADO',
      mostrarValor: Boolean(state.editing.mostrarValor),
      valor: state.editing.valor ? String(Number(state.editing.valor || 0)) : '',
      fecha: state.editing.fecha ? String(state.editing.fecha).slice(0, 16) : '',
    });
  }, [state.editing]);

  const anticipados = useMemo(
    () => state.premios.filter((premio) => premio.tipo === 'ANTICIPADO'),
    [state.premios]
  );

  const mayores = useMemo(
    () => state.premios.filter((premio) => premio.tipo === 'MAYOR'),
    [state.premios]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, saving: true, error: null, success: '' }));

      const payload = {
        rifaId: id,
        nombre: form.nombre,
        descripcion: form.descripcion,
        tipo: form.tipo,
        mostrarValor: form.mostrarValor,
        valor: form.mostrarValor ? Number(form.valor || 0) : null,
        fecha: form.fecha,
      };

      if (state.editing?.id) {
        await client.put(endpoints.premioById(state.editing.id), payload);
      } else {
        await client.post(endpoints.premios(), payload);
      }

      await loadData();
      setState((prev) => ({
        ...prev,
        saving: false,
        editing: null,
        success: state.editing ? 'Premio actualizado correctamente.' : 'Premio creado correctamente.',
      }));
      setForm(initialForm);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error.message,
      }));
    }
  };

  const handleSaveBoletas = async (premioId: string) => {
    try {
      const numeros = parseNumbers(boletasPorPremio[premioId] || '');
      await client.put(endpoints.premioBoletas(premioId), { numeros });
      await loadData();
      setState((prev) => ({
        ...prev,
        success: 'Boletas que juegan actualizadas correctamente.',
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  const handleDelete = async () => {
    if (!state.deleteId) {
      return;
    }

    try {
      await client.delete(endpoints.premioById(state.deleteId));
      await loadData();
      setState((prev) => ({
        ...prev,
        deleteId: null,
        success: 'Premio eliminado correctamente.',
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        deleteId: null,
        error: error.message,
      }));
    }
  };

  return (
    <div>
      <Topbar
        title="Premios y boletas que juegan"
        actions={
          id ? (
            <Link
              to={`/rifas/${id}`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Volver a rifa
            </Link>
          ) : null
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}
        {state.loading ? <Loading /> : null}

        {!state.loading && state.rifa ? (
          <>
            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-base font-semibold">
                {state.rifa.nombre}
              </h3>
              <p className="theme-content-subtitle text-sm">
                Define los premios anticipados y el premio mayor, y luego pega las boletas que juegan en cada uno.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="theme-section-card grid gap-4 rounded-lg p-6 shadow-sm md:grid-cols-2"
            >
              <h3 className="theme-main-title theme-content-title md:col-span-2 text-base font-semibold">
                {state.editing ? 'Editar premio' : 'Crear premio'}
              </h3>
              <label className="text-sm">
                <span className="text-slate-600">Nombre</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, nombre: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-600">Tipo</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.tipo}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tipo: event.target.value }))
                  }
                >
                  <option value="ANTICIPADO">Anticipado</option>
                  <option value="MAYOR">Premio mayor</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                <span className="text-slate-600">Descripcion</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, descripcion: event.target.value }))
                  }
                />
              </label>
              <label className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.mostrarValor}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      mostrarValor: event.target.checked,
                      valor: event.target.checked ? prev.valor : '',
                    }))
                  }
                />
                <span className="text-slate-700">
                  Mostrar valor en dinero para este premio
                </span>
              </label>
              {form.mostrarValor ? (
                <MoneyInput
                  label="Valor"
                  name="valor"
                  value={form.valor}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, valor: String(event.target.value) }))
                  }
                  required
                />
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Este premio se manejara como material o sin valor visible.
                </div>
              )}
              <label className="text-sm">
                <span className="text-slate-600">Cuando juega</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.fecha}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, fecha: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={state.saving}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                >
                  {state.editing ? 'Guardar cambios' : 'Crear premio'}
                </button>
                {state.editing ? (
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                    onClick={() => setState((prev) => ({ ...prev, editing: null }))}
                  >
                    Cancelar edicion
                  </button>
                ) : null}
              </div>
            </form>

            {[{ title: 'Premios anticipados', data: anticipados }, { title: 'Premio mayor', data: mayores }].map(
              (section) => (
                <div key={section.title} className="theme-section-card rounded-lg p-6 shadow-sm">
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">
                    {section.title}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {section.data.length ? (
                      section.data.map((premio) => (
                        <div key={premio.id} className="rounded-lg border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-slate-900">{premio.nombre}</div>
                              <div className="text-sm text-slate-500">
                                {formatDateTime(premio.fecha)}
                                {premio.mostrarValor && premio.valor
                                  ? ` · ${formatCOP(premio.valor)}`
                                  : ''}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {premio.descripcion || 'Sin descripcion'}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                Boletas que juegan: {premio.boletas?.length || 0}
                              </div>
                            </div>
                            <div className="flex gap-3 text-sm">
                              <button
                                type="button"
                                className="text-indigo-600"
                                onClick={() => setState((prev) => ({ ...prev, editing: premio }))}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="text-rose-600"
                                onClick={() => setState((prev) => ({ ...prev, deleteId: premio.id }))}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="text-sm">
                              <span className="text-slate-600">Boletas que juegan</span>
                              <textarea
                                className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
                                value={boletasPorPremio[premio.id] || ''}
                                onChange={(event) =>
                                  setBoletasPorPremio((prev) => ({
                                    ...prev,
                                    [premio.id]: event.target.value,
                                  }))
                                }
                                placeholder="Pega aqui los numeros que juegan para este premio."
                              />
                            </label>
                            <div className="mt-3 flex items-center justify-between gap-4">
                              <p className="text-xs text-slate-500">
                                Los numeros que no aparezcan aqui quedaran como no participantes en este premio.
                              </p>
                              <button
                                type="button"
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                onClick={() => void handleSaveBoletas(premio.id)}
                              >
                                Guardar boletas que juegan
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="Sin premios registrados"
                        description={`Todavia no hay ${section.title.toLowerCase()} para esta rifa.`}
                      />
                    )}
                  </div>
                </div>
              )
            )}
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(state.deleteId)}
        title="Eliminar premio"
        description="Esta accion eliminara el premio y tambien la lista de boletas que juegan en el."
        onCancel={() => setState((prev) => ({ ...prev, deleteId: null }))}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default RifaPremiosPage;
