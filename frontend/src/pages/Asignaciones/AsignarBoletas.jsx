import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Toast from '../../components/common/Toast';

const useQuery = () => new URLSearchParams(useLocation().search);

const AsignarBoletas = () => {
  const query = useQuery();
  const preselected = query.get('rifaVendedor');
  const [state, setState] = useState({
    rifas: [],
    vendedores: [],
    rifaVendedores: [],
    loading: true,
    error: null,
    success: ''
  });

  const [form, setForm] = useState({
    rifa_vendedor_id: preselected || '',
    cantidad: 1,
    motivo: '',
    fecha: ''
  });

  const [linkForm, setLinkForm] = useState({
    rifa_id: '',
    vendedor_id: '',
    comision_pct: 0,
    precio_casa: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifasRes, vendedoresRes, rifaVendedoresRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.vendedores()),
          client.get(endpoints.rifaVendedores())
        ]);

        setState({
          rifas: rifasRes.data,
          vendedores: vendedoresRes.data,
          rifaVendedores: rifaVendedoresRes.data,
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

  // Update effect to auto-calculate price
  useEffect(() => {
    if (linkForm.rifa_id && linkForm.comision_pct >= 0) {
      const rifa = state.rifas.find(r => r.id === linkForm.rifa_id);
      if (rifa) {
        const precioBoleta = rifa.precio_boleta;
        const comision = (precioBoleta * linkForm.comision_pct) / 100;
        const precioCasa = precioBoleta - comision;
        setLinkForm(prev => ({ ...prev, precio_casa: precioCasa }));
      }
    }
  }, [linkForm.rifa_id, linkForm.comision_pct, state.rifas]);

  const selectedRifaVendedor = useMemo(() => {
    return state.rifaVendedores.find((rv) => rv.id === form.rifa_vendedor_id);
  }, [state.rifaVendedores, form.rifa_vendedor_id]);

  const handleSubmit = async (event, action) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: null, success: '' }));
    try {
      const payload = {
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
        fecha: form.fecha || undefined
      };

      if (action === 'asignar') {
        await client.post(endpoints.asignarBoletas(form.rifa_vendedor_id), payload);
      } else {
        await client.post(endpoints.quitarBoletas(form.rifa_vendedor_id), payload);
      }

      setState((prev) => ({ ...prev, success: 'Operación registrada correctamente.' }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const handleVincular = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: null, success: '' }));
    try {
      await client.post(endpoints.vincularVendedor(), {
        ...linkForm,
        comision_pct: Number(linkForm.comision_pct),
        precio_casa: Number(linkForm.precio_casa)
      });
      const refreshed = await client.get(endpoints.rifaVendedores());
      setState((prev) => ({ ...prev, rifaVendedores: refreshed.data, success: 'Vínculo creado.' }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  return (
    <div>
      <Topbar title="Asignación de boletas" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success && <Toast message={state.success} />}
        {state.loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <form className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold">Asignar / quitar boletas</h3>
              <label className="block text-sm">
                <span className="text-slate-600">Rifa + Vendedor</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.rifa_vendedor_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, rifa_vendedor_id: event.target.value }))}
                  required
                >
                  <option value="">Selecciona un vínculo</option>
                  {state.rifaVendedores.map((rv) => (
                    <option key={rv.id} value={rv.id}>
                      {rv.Rifa?.nombre} - {rv.Vendedor?.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Cantidad</span>
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.cantidad}
                  onChange={(event) => setForm((prev) => ({ ...prev, cantidad: event.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Motivo</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.motivo}
                  onChange={(event) => setForm((prev) => ({ ...prev, motivo: event.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Fecha</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.fecha}
                  onChange={(event) => setForm((prev) => ({ ...prev, fecha: event.target.value }))}
                />
              </label>
              {selectedRifaVendedor && (
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                  Saldo actual: {selectedRifaVendedor.saldo_actual}
                  <br />
                  Boletas asignadas: {selectedRifaVendedor.boletas_asignadas}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white"
                  onClick={(event) => handleSubmit(event, 'asignar')}
                  disabled={!form.rifa_vendedor_id}
                >
                  Aumentar
                </button>
                <button
                  type="button"
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white"
                  onClick={(event) => handleSubmit(event, 'quitar')}
                  disabled={!form.rifa_vendedor_id}
                >
                  Disminuir
                </button>
              </div>
            </form>

            <form onSubmit={handleVincular} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold">Vincular vendedor a rifa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="text-slate-600">Rifa</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={linkForm.rifa_id}
                    onChange={(event) => setLinkForm((prev) => ({ ...prev, rifa_id: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona una rifa</option>
                    {state.rifas.map((rifa) => (
                      <option key={rifa.id} value={rifa.id}>
                        {rifa.nombre} (${rifa.precio_boleta?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Vendedor</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={linkForm.vendedor_id}
                    onChange={(event) => setLinkForm((prev) => ({ ...prev, vendedor_id: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona un vendedor</option>
                    {state.vendedores.map((vendedor) => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Comisión (%)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={linkForm.comision_pct}
                      onChange={(event) => setLinkForm((prev) => ({ ...prev, comision_pct: event.target.value }))}
                      min="0"
                      max="100"
                    />
                  </div>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Precio a pagar a la Casa (por boleta)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-100 font-semibold text-slate-700"
                    value={linkForm.precio_casa}
                    onChange={(event) => setLinkForm((prev) => ({ ...prev, precio_casa: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">Calculado automáticamente: Precio Boleta - Comisión</p>
                </label>
              </div>
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white w-full md:w-auto" type="submit">
                Vincular Nuevo
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsignarBoletas;
