import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';
import SearchableSelect from '../../components/common/SearchableSelect';

const GastoForm = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({ rifas: [], cajas: [], rifaVendedores: [], loading: true, error: null });
  const [form, setForm] = useState({
    rifa_id: '',
    caja_id: '',
    rifa_vendedor_id: '',
    valor: 0,
    descripcion: '',
    fecha: '',
    tipo: 'GASTO'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifasRes, cajasRes, rvRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.cajas()),
          client.get(endpoints.rifaVendedores())
        ]);
        setState({
          rifas: rifasRes.data,
          cajas: cajasRes.data,
          rifaVendedores: rvRes.data,
          loading: false,
          error: null
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, []);

  const optionsRV = useMemo(() => {
    return state.rifaVendedores.map(rv => ({
      value: rv.id,
      label: `${rv.Rifa?.nombre || 'Sin Rifa'} - ${rv.Vendedor?.nombre || 'Sin Vendedor'}`
    }));
  }, [state.rifaVendedores]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: null }));
    try {
      await client.post(endpoints.gastos(), {
        ...form,
        valor: Number(form.valor),
        fecha: form.fecha || undefined,
        // Reset rv if not devolucion
        rifa_vendedor_id: form.tipo === 'DEVOLUCION' ? form.rifa_vendedor_id : null
      });
      navigate('/gastos');
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  return (
    <div>
      <Topbar title="Registrar gasto" />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-slate-600">Rifa</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  name="rifa_id"
                  value={form.rifa_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una rifa</option>
                  {state.rifas.map((rifa) => (
                    <option key={rifa.id} value={rifa.id}>
                      {rifa.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Caja de la cual sale el dinero</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  name="caja_id"
                  value={form.caja_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una caja</option>
                  {state.cajas.map((caja) => (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombre} (${caja.saldo?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-slate-600">Tipo de Gasto</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-semibold"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                >
                  <option value="GASTO">GASTO GENERAL</option>
                  <option value="DEVOLUCION">DEVOLUCION A VENDEDOR</option>
                </select>
              </label>
              <MoneyInput label="Valor" name="valor" value={form.valor} onChange={handleChange} required />
            </div>

            {form.tipo === 'DEVOLUCION' && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-md">
                <label className="block text-sm">
                  <span className="text-orange-800 font-semibold italic">Amarrar a Vendedor (para restar devolución)</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={optionsRV}
                      value={form.rifa_vendedor_id}
                      onChange={(val) => setForm(prev => ({ ...prev, rifa_vendedor_id: val }))}
                      placeholder="Busca el vendedor para aplicar devolución..."
                    />
                  </div>
                  <p className="text-xs text-orange-600 mt-1">* Esto aumentará la deuda del vendedor en el valor indicado.</p>
                </label>
              </div>
            )}

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
              <span className="text-slate-600">Descripción / Motivo</span>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="2"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/gastos')}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button className="rounded-md bg-slate-900 px-6 py-2 text-sm text-white font-medium hover:bg-slate-800" type="submit">
                Guardar registro
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GastoForm;
