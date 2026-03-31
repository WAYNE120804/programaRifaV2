import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Topbar from '../../components/Layout/Topbar';

const initialForm = {
  nombre: '',
  telefono: '',
  documento: '',
  direccion: '',
};

const VendedorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVendedor = async () => {
      if (!id) return;

      try {
        const { data } = await client.get(endpoints.vendedorById(id));
        setForm({
          nombre: data.nombre,
          telefono: data.telefono || '',
          documento: data.documento || '',
          direccion: data.direccion || '',
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadVendedor();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      if (id) {
        await client.put(endpoints.vendedorById(id), form);
      } else {
        await client.post(endpoints.vendedores(), form);
      }

      navigate('/vendedores');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div>
      <Topbar title={id ? 'Editar vendedor' : 'Crear vendedor'} />
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
              <span className="text-slate-600">Documento</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="documento"
                value={form.documento}
                onChange={handleChange}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Telefono</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Direccion</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                onClick={() => navigate('/vendedores')}
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

export default VendedorForm;
