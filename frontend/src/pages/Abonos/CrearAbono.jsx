import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';
import Toast from '../../components/common/Toast';

const useQuery = () => new URLSearchParams(useLocation().search);

const CrearAbono = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const preselected = query.get('rifaVendedor');
  const [state, setState] = useState({
    rifaVendedores: [],
    cajas: [],
    loading: true,
    error: null,
    success: ''
  });

  const [form, setForm] = useState({
    rifa_vendedor_id: preselected || '',
    valor: 0,
    fecha: '',
    medio_pago: 'Efectivo',
    caja_id: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifaVendedoresRes, cajasRes] = await Promise.all([
          client.get(endpoints.rifaVendedores()),
          client.get(endpoints.cajas())
        ]);

        setState({
          rifaVendedores: rifaVendedoresRes.data,
          cajas: cajasRes.data,
          loading: false,
          error: null,
          success: ''
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, []);

  const selectedRifaVendedor = useMemo(() => {
    return state.rifaVendedores.find((rv) => rv.id === form.rifa_vendedor_id);
  }, [state.rifaVendedores, form.rifa_vendedor_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: null, success: '' }));
    try {
      const payload = {
        valor: Number(form.valor),
        fecha: form.fecha || undefined,
        medio_pago: form.medio_pago,
        caja_id: form.caja_id
      };

      const { data } = await client.post(endpoints.crearAbono(form.rifa_vendedor_id), payload);
      setState((prev) => ({ ...prev, success: 'Abono registrado correctamente.' }));
      if (data?.recibo?.id) {
        navigate(`/recibos/${data.recibo.id}`);
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  return (
    <div>
      <Topbar title="Registrar abono" />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success && <Toast message={state.success} />}
        {state.loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow-sm">
            <label className="block text-sm">
              <span className="text-slate-600">Rifa + Vendedor</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="rifa_vendedor_id"
                value={form.rifa_vendedor_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona vínculo</option>
                {state.rifaVendedores.map((rv) => (
                  <option key={rv.id} value={rv.id}>
                    {rv.Rifa?.nombre} - {rv.Vendedor?.nombre}
                  </option>
                ))}
              </select>
            </label>
            {selectedRifaVendedor && (
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                Saldo actual: {selectedRifaVendedor.saldo_actual}
              </div>
            )}
            <MoneyInput label="Valor del abono" name="valor" value={form.valor} onChange={handleChange} required />
            <label className="block text-sm">
              <span className="text-slate-600">Fecha</span>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Medio de pago</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="medio_pago"
                value={form.medio_pago}
                onChange={handleChange}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Caja</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="caja_id"
                value={form.caja_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona caja</option>
                {state.cajas.map((caja) => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end">
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white" type="submit">
                Guardar abono
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CrearAbono;
