import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DateInput from '../../components/common/DateInput';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';
import Topbar from '../../components/Layout/Topbar';
import { todayISO } from '../../utils/dates';

const initialForm = {
  nombre: '',
  loteriaNombre: '',
  numeroCifras: '4',
  fechaInicio: todayISO(),
  fechaFin: todayISO(),
  precio_boleta: '0',
  estado: 'BORRADOR',
};

const estadoOptions = ['BORRADOR', 'ACTIVA', 'CERRADA', 'SORTEADA', 'ANULADA'];
const cifrasOptions = [
  { value: '2', label: '2 cifras (00 a 99)' },
  { value: '3', label: '3 cifras (000 a 999)' },
  { value: '4', label: '4 cifras (0000 a 9999)' },
];

const RifaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRifa = async () => {
      if (!id) return;

      try {
        const { data } = await client.get(endpoints.rifaById(id));
        setForm({
          nombre: data.nombre,
          loteriaNombre: data.loteriaNombre || '',
          numeroCifras: String(data.numeroCifras ?? 4),
          fechaInicio: data.fechaInicio ? data.fechaInicio.slice(0, 10) : todayISO(),
          fechaFin: data.fechaFin ? data.fechaFin.slice(0, 10) : todayISO(),
          precio_boleta: String(data.precioBoleta ?? 0),
          estado: data.estado || 'BORRADOR',
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadRifa();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const payload = {
        nombre: form.nombre,
        numeroCifras: Number(form.numeroCifras),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        precioBoleta: Number(form.precio_boleta),
        loteriaNombre: form.loteriaNombre,
        estado: form.estado,
      };

      if (id) {
        await client.put(endpoints.rifaById(id), payload);
      } else {
        await client.post(endpoints.rifas(), payload);
      }

      navigate('/rifas');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <Topbar title={id ? 'Editar rifa' : 'Crear rifa'} />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-lg bg-white p-6 shadow-sm"
          >
            <label className="text-sm">
              <span className="text-slate-600">Nombre</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Loteria con la que juega</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="loteriaNombre"
                value={form.loteriaNombre}
                onChange={handleChange}
                required
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-600">Cantidad de cifras</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="numeroCifras"
                value={form.numeroCifras}
                onChange={handleChange}
              >
                {cifrasOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Al crear la rifa se generaran automaticamente todas las boletas segun esta numeracion.
              </p>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <DateInput
                label="Fecha inicio"
                name="fechaInicio"
                value={form.fechaInicio}
                onChange={handleChange}
                required
              />
              <DateInput
                label="Fecha fin"
                name="fechaFin"
                value={form.fechaFin}
                onChange={handleChange}
                required
              />
            </div>

            <MoneyInput
              label="Precio por boleta"
              name="precio_boleta"
              value={form.precio_boleta}
              onChange={handleChange}
              required
            />

            <label className="text-sm">
              <span className="text-slate-600">Estado</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="estado"
                value={form.estado}
                onChange={handleChange}
              >
                {estadoOptions.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                onClick={() => navigate('/rifas')}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                type="submit"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RifaForm;
