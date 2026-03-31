import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { todayISO } from '../../utils/dates';
import { gastoCategoryOptions } from './gastoCategories';

const initialForm = {
  rifaId: '',
  subCajaId: '',
  categoria: 'OTROS',
  valor: 0,
  fecha: todayISO(),
  descripcion: '',
};

const GastoForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingSubCajas, setLoadingSubCajas] = useState(false);
  const [rifas, setRifas] = useState<any[]>([]);
  const [subCajas, setSubCajas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const loadRifas = async () => {
      try {
        const { data } = await client.get(endpoints.rifas());
        setRifas(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadRifas();
  }, []);

  const rifaOptions = useMemo(
    () =>
      rifas.map((rifa) => ({
        value: rifa.id,
        label: rifa.nombre,
      })),
    [rifas]
  );

  const handleChange = (event: { target: { name: string; value: string | number } }) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadSubCajas = async () => {
      if (!form.rifaId) {
        setSubCajas([]);
        setForm((prev) => ({ ...prev, subCajaId: '' }));
        return;
      }

      try {
        setLoadingSubCajas(true);
        const { data } = await client.get(endpoints.subCajas(), {
          params: { rifaId: form.rifaId },
        });
        setSubCajas(data);
        setForm((prev) => ({
          ...prev,
          subCajaId: prev.subCajaId && data.some((item: any) => item.id === prev.subCajaId)
            ? prev.subCajaId
            : data[0]?.id || '',
        }));
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoadingSubCajas(false);
      }
    };

    void loadSubCajas();
  }, [form.rifaId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        rifaId: form.rifaId,
        subCajaId: form.subCajaId || undefined,
        categoria: form.categoria,
        valor: Number(form.valor),
        fecha: form.fecha,
        descripcion: form.descripcion.trim(),
      };

      const { data } = await client.post(endpoints.gastos(), payload);
      navigate(`/gasto-recibos/${data.id}`);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Registrar gasto"
        actions={
          <Link
            to="/gastos"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            VER HISTORIAL
          </Link>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Registrar gasto
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            Cada gasto queda asociado a una rifa y genera su propio recibo tipo tirilla.
          </p>

          {loading ? (
            <p className="theme-content-subtitle mt-6 text-sm">Cargando rifas...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="block text-sm">
                  <span className="text-slate-600">Rifa</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={rifaOptions}
                      value={form.rifaId}
                      onChange={(value) => setForm((prev) => ({ ...prev, rifaId: value }))}
                      placeholder="Buscar rifa..."
                      clearable
                      clearLabel="Quitar seleccion"
                    />
                  </div>
                </div>
                <label className="block text-sm">
                  <span className="text-slate-600">Categoria</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="categoria"
                    value={form.categoria}
                    onChange={(event) => handleChange({ target: { name: 'categoria', value: event.target.value } })}
                    required
                  >
                    {gastoCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-slate-600">Subcaja origen</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="subCajaId"
                    value={form.subCajaId}
                    onChange={(event) => handleChange({ target: { name: 'subCajaId', value: event.target.value } })}
                    required
                    disabled={!form.rifaId || loadingSubCajas || !subCajas.length}
                  >
                    <option value="">
                      {loadingSubCajas ? 'Cargando subcajas...' : 'Selecciona una subcaja'}
                    </option>
                    {subCajas.map((subCaja) => (
                      <option key={subCaja.id} value={subCaja.id}>
                        {subCaja.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Fecha del gasto</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="fecha"
                    value={form.fecha}
                    onChange={(event) => handleChange({ target: { name: 'fecha', value: event.target.value } })}
                    required
                  />
                </label>
                <MoneyInput
                  label="Valor del gasto"
                  name="valor"
                  value={form.valor}
                  onChange={handleChange}
                  required
                />
                <label className="block text-sm">
                  <span className="text-slate-600">Descripcion</span>
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={(event) => handleChange({ target: { name: 'descripcion', value: event.target.value } })}
                    placeholder="Ej: transporte, publicidad, compra de insumos..."
                    required
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.rifaId ||
                    !form.subCajaId ||
                    Number(form.valor) <= 0 ||
                    !form.descripcion.trim()
                  }
                  className="rounded-md bg-slate-900 px-5 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'GUARDANDO...' : 'REGISTRAR GASTO'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default GastoForm;
