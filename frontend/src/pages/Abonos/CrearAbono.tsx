import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { todayISO } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const useQuery = () => new URLSearchParams(useLocation().search);

const initialForm = {
  rifaVendedorId: '',
  subCajaId: '',
  valor: 0,
  fecha: todayISO(),
  metodoPago: 'EFECTIVO',
  descripcion: '',
};

const CrearAbono = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const [loading, setLoading] = useState(true);
  const [loadingSubCajas, setLoadingSubCajas] = useState(false);
  const [rifaVendedores, setRifaVendedores] = useState<any[]>([]);
  const [subCajas, setSubCajas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    rifaVendedorId: query.get('rifaVendedor') || '',
  }));

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await client.get(endpoints.rifaVendedores());
        setRifaVendedores(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const relationOptions = useMemo(
    () =>
      rifaVendedores.map((item) => ({
        value: item.id,
        label: `${item.rifa?.nombre || 'Sin rifa'} - ${item.vendedor?.nombre || 'Sin vendedor'}`,
      })),
    [rifaVendedores]
  );

  const selectedRelation = useMemo(
    () => rifaVendedores.find((item) => item.id === form.rifaVendedorId) || null,
    [rifaVendedores, form.rifaVendedorId]
  );

  const maxAbono = Number(selectedRelation?.saldoActual || 0);

  useEffect(() => {
    const loadSubCajas = async () => {
      if (!selectedRelation?.rifaId) {
        setSubCajas([]);
        setForm((prev) => ({ ...prev, subCajaId: '' }));
        return;
      }

      try {
        setLoadingSubCajas(true);
        const { data } = await client.get(endpoints.subCajas(), {
          params: { rifaId: selectedRelation.rifaId },
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
  }, [selectedRelation?.rifaId]);

  const handleChange = (event: { target: { name: string; value: string | number } }) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess('');

    try {
      const payload = {
        subCajaId: form.subCajaId,
        valor: Number(form.valor),
        fecha: form.fecha,
        metodoPago: form.metodoPago,
        descripcion: form.descripcion.trim() || undefined,
      };

      const { data } = await client.post(endpoints.crearAbono(form.rifaVendedorId), payload);
      setSuccess('ABONO REGISTRADO CORRECTAMENTE.');
      navigate(`/recibos/${data.id}`);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Registrar abono"
        actions={
          <Link
            to="/abonos"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            VER HISTORIAL
          </Link>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {success ? <Toast message={success} /> : null}
        <section className="theme-section-card rounded-2xl p-6 shadow-sm">
          <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
            Registrar abono a vendedor
          </h3>
          <p className="theme-content-subtitle mt-2 text-sm">
            El abono rebaja la deuda actual del vendedor en esa rifa y genera un recibo verificable.
          </p>

          {loading ? (
            <p className="theme-content-subtitle mt-6 text-sm">Cargando relaciones...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="block text-sm">
                  <span className="text-slate-600">Relacion rifa-vendedor</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={relationOptions}
                      value={form.rifaVendedorId}
                      onChange={(value) => setForm((prev) => ({ ...prev, rifaVendedorId: value }))}
                      placeholder="Buscar rifa o vendedor..."
                      clearable
                      clearLabel="Quitar seleccion"
                    />
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="text-slate-600">Subcaja destino</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="subCajaId"
                    value={form.subCajaId}
                    onChange={(event) => handleChange({ target: { name: 'subCajaId', value: event.target.value } })}
                    required
                    disabled={!selectedRelation || loadingSubCajas || !subCajas.length}
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
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-slate-600">Metodo de pago</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="metodoPago"
                    value={form.metodoPago}
                    onChange={(event) => handleChange({ target: { name: 'metodoPago', value: event.target.value } })}
                    required
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="NEQUI">NEQUI</option>
                    <option value="DAVIPLATA">DAVIPLATA</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  </select>
                </label>
              </div>

              {selectedRelation ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="theme-summary-card rounded-2xl p-5">
                    <p className="theme-summary-label">RIFA</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {selectedRelation.rifa?.nombre}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5">
                    <p className="theme-summary-label">VENDEDOR</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {selectedRelation.vendedor?.nombre}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5">
                    <p className="theme-summary-label">DEUDA ACTUAL</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {formatCOP(selectedRelation.saldoActual)}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5">
                    <p className="theme-summary-label">BOLETAS ACTUALES</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {selectedRelation._count?.boletas || 0}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-3">
                <MoneyInput
                  label="Valor del abono"
                  name="valor"
                  value={form.valor}
                  onChange={handleChange}
                  required
                />
                <label className="block text-sm">
                  <span className="text-slate-600">Fecha del abono</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    name="fecha"
                    value={form.fecha}
                    onChange={(event) => handleChange({ target: { name: 'fecha', value: event.target.value } })}
                    required
                  />
                </label>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Control de deuda</p>
                  <p className="mt-2">
                    El abono no puede superar la deuda actual del vendedor. Maximo permitido:{' '}
                    <strong>{formatCOP(maxAbono)}</strong>
                  </p>
                </div>
              </div>

              <label className="block text-sm">
                <span className="text-slate-600">Descripcion</span>
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={(event) => handleChange({ target: { name: 'descripcion', value: event.target.value } })}
                  placeholder="Ej: abono parcial de la semana, pago en efectivo, ajuste por acuerdo..."
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.rifaVendedorId ||
                    !form.subCajaId ||
                    Number(form.valor) <= 0
                  }
                  className="rounded-md bg-slate-900 px-5 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'GUARDANDO...' : 'REGISTRAR ABONO'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default CrearAbono;
