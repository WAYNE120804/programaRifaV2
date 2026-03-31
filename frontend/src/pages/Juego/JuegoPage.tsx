import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import SearchableSelect from '../../components/common/SearchableSelect';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { downloadJuegoExcel, printJuegoLetterReport } from '../../utils/juego-reports';

type JuegoResumen = {
  rifa?: {
    id: string;
    nombre: string;
    loteriaNombre?: string | null;
    numeroCifras: number;
  } | null;
  premio?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    fecha: string;
    tipo: string;
    mostrarValor?: boolean;
    valor?: number | string | null;
  } | null;
  totalBoletas: number;
  totalVendedores: number;
  grupos: Array<{
    rifaVendedorId: string;
    vendedor: {
      nombre?: string | null;
      documento?: string | null;
      telefono?: string | null;
      direccion?: string | null;
    };
    precioCasa?: number | string;
    totalBoletas: number;
    boletas: Array<{ id: string; numero: string; estado: string }>;
  }>;
};

const initialForm = {
  premioId: '',
  rifaVendedorId: '',
  modo: 'LISTA',
  numeros: '',
};

function parseNumbers(rawValue: string) {
  const matches = rawValue.match(/\d+/g);
  return matches ? [...new Set(matches)] : [];
}

const JuegoPage = () => {
  const { config } = useAppConfig();
  const [state, setState] = useState({
    rifas: [] as any[],
    premios: [] as any[],
    rifaVendedores: [] as any[],
    resumen: null as JuegoResumen | null,
    loadingSetup: true,
    loadingResumen: false,
    saving: false,
    error: null as string | null,
    success: '',
  });
  const [filters, setFilters] = useState({
    rifaId: '',
    premioId: '',
    rifaVendedorId: '',
    numero: '',
  });
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const loadSetup = async () => {
      try {
        const [rifasRes, relacionesRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.rifaVendedores()),
        ]);

        setState((prev) => ({
          ...prev,
          rifas: rifasRes.data,
          rifaVendedores: relacionesRes.data,
          loadingSetup: false,
          error: null,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loadingSetup: false,
          error: error.message,
        }));
      }
    };

    void loadSetup();
  }, []);

  useEffect(() => {
    if (!filters.rifaId) {
      setState((prev) => ({ ...prev, premios: [] }));
      return;
    }

    const loadPremios = async () => {
      try {
        const { data } = await client.get(endpoints.premios(), {
          params: { rifaId: filters.rifaId },
        });

        setState((prev) => ({
          ...prev,
          premios: data,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          premios: [],
          error: error.message,
        }));
      }
    };

    void loadPremios();
  }, [filters.rifaId]);

  useEffect(() => {
    if (!filters.rifaId || !filters.premioId) {
      setState((prev) => ({ ...prev, resumen: null, loadingResumen: false }));
      return;
    }

    const loadResumen = async () => {
      try {
        setState((prev) => ({ ...prev, loadingResumen: true, error: null }));
        const { data } = await client.get(endpoints.juego(), {
          params: {
            rifaId: filters.rifaId,
            premioId: filters.premioId,
            rifaVendedorId: filters.rifaVendedorId || undefined,
            numero: filters.numero || undefined,
          },
        });

        setState((prev) => ({
          ...prev,
          resumen: data,
          loadingResumen: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loadingResumen: false,
          resumen: null,
          error: error.message,
        }));
      }
    };

    void loadResumen();
  }, [filters.rifaId, filters.premioId, filters.rifaVendedorId, filters.numero]);

  const rifaOptions = useMemo(
    () =>
      state.rifas.map((rifa) => ({
        value: rifa.id,
        label: `${rifa.nombre} (${rifa.numeroCifras} cifras)`,
      })),
    [state.rifas]
  );

  const premioOptions = useMemo(
    () =>
      state.premios.map((premio) => ({
        value: premio.id,
        label: `${premio.nombre} - ${premio.tipo} - ${formatDateTime(premio.fecha)}`,
      })),
    [state.premios]
  );

  const relationOptions = useMemo(
    () =>
      state.rifaVendedores
        .filter((item) => (filters.rifaId ? item.rifaId === filters.rifaId : true))
        .map((item) => ({
          value: item.id,
          label: `${item.vendedor?.nombre || 'Sin vendedor'} - ${item.rifa?.nombre || 'Sin rifa'}`,
        })),
    [state.rifaVendedores, filters.rifaId]
  );

  const selectedRifa = useMemo(
    () => state.rifas.find((item) => item.id === filters.rifaId) || null,
    [state.rifas, filters.rifaId]
  );

  const selectedPremio = useMemo(
    () => state.premios.find((item) => item.id === filters.premioId) || null,
    [state.premios, filters.premioId]
  );

  const selectedRelation = useMemo(
    () => state.rifaVendedores.find((item) => item.id === form.rifaVendedorId) || null,
    [state.rifaVendedores, form.rifaVendedorId]
  );

  const selectedGroup = useMemo(
    () =>
      state.resumen?.grupos.find((item) => item.rifaVendedorId === form.rifaVendedorId) || null,
    [state.resumen, form.rifaVendedorId]
  );

  useEffect(() => {
    if (!form.rifaVendedorId) {
      setForm((prev) => ({ ...prev, numeros: '' }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      numeros: selectedGroup ? selectedGroup.boletas.map((item) => item.numero).join('\n') : '',
    }));
  }, [form.rifaVendedorId, selectedGroup]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      premioId: filters.premioId || prev.premioId,
    }));
  }, [filters.premioId]);

  const handleSaveJuego = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.premioId) {
      setState((prev) => ({ ...prev, error: 'Debes seleccionar un premio.' }));
      return;
    }

    if (!form.rifaVendedorId) {
      setState((prev) => ({
        ...prev,
        error: 'Debes seleccionar un vendedor para registrar el juego.',
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, saving: true, error: null, success: '' }));

      await client.put(endpoints.juegoRifaVendedor(form.rifaVendedorId), {
        premioId: form.premioId,
        modo: form.modo,
        numeros: form.modo === 'LISTA' ? parseNumbers(form.numeros) : [],
      });

      const { data } = await client.get(endpoints.juego(), {
        params: {
          rifaId: filters.rifaId,
          premioId: form.premioId,
          rifaVendedorId: filters.rifaVendedorId || undefined,
          numero: filters.numero || undefined,
        },
      });

      setState((prev) => ({
        ...prev,
        resumen: data,
        saving: false,
        success:
          form.modo === 'TODAS'
            ? 'Todas las boletas del vendedor quedaron jugando para ese premio.'
            : form.modo === 'NINGUNA'
              ? 'El vendedor quedo sin boletas jugando para ese premio.'
              : 'Boletas que juegan actualizadas correctamente para ese premio.',
      }));

      setFilters((prev) => ({
        ...prev,
        premioId: form.premioId,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error.message,
      }));
    }
  };

  const handleDownloadExcel = () => {
    if (!state.resumen?.grupos?.length || !selectedRifa || !state.resumen.premio) {
      setState((prev) => ({
        ...prev,
        error: 'No hay boletas en juego para exportar en Excel.',
      }));
      return;
    }

    downloadJuegoExcel({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      rifaNombre: selectedRifa.nombre,
      loteriaNombre: selectedRifa.loteriaNombre,
      premioNombre: state.resumen.premio.nombre,
      premioDescripcion: state.resumen.premio.descripcion,
      premioFecha: formatDateTime(state.resumen.premio.fecha),
      totalBoletas: state.resumen.totalBoletas,
      grupos: state.resumen.grupos,
    });
  };

  const handlePrint = () => {
    if (!state.resumen?.grupos?.length || !selectedRifa || !state.resumen.premio) {
      setState((prev) => ({
        ...prev,
        error: 'No hay boletas en juego para imprimir.',
      }));
      return;
    }

    printJuegoLetterReport({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      rifaNombre: selectedRifa.nombre,
      loteriaNombre: selectedRifa.loteriaNombre,
      premioNombre: state.resumen.premio.nombre,
      premioDescripcion: state.resumen.premio.descripcion,
      premioFecha: formatDateTime(state.resumen.premio.fecha),
      totalBoletas: state.resumen.totalBoletas,
      grupos: state.resumen.grupos,
    });
  };

  return (
    <div>
      <Topbar
        title="Juego"
        actions={
          filters.rifaId ? (
            <Link
              to={`/rifas/${filters.rifaId}`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Ver rifa
            </Link>
          ) : null
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}
        {state.loadingSetup ? <Loading /> : null}

        {!state.loadingSetup ? (
          <>
            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">
                    Filtros del juego
                  </h3>
                  <p className="theme-content-subtitle text-sm">
                    Selecciona rifa y premio para revisar las boletas que si juegan por vendedor.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-slate-600"
                  onClick={() => {
                    setFilters({ rifaId: '', premioId: '', rifaVendedorId: '', numero: '' });
                    setForm(initialForm);
                  }}
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div>
                  <span className="text-sm text-slate-600">Rifa</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={rifaOptions}
                      value={filters.rifaId}
                      onChange={(value) => {
                        setFilters({ rifaId: value, premioId: '', rifaVendedorId: '', numero: '' });
                        setForm(initialForm);
                      }}
                      placeholder="Buscar rifa..."
                      clearable
                      clearLabel="Quitar filtro de rifa"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Premio</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={premioOptions}
                      value={filters.premioId}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, premioId: value, rifaVendedorId: '' }))
                      }
                      placeholder="Selecciona premio..."
                      clearable
                      clearLabel="Quitar filtro de premio"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Vendedor</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={relationOptions}
                      value={filters.rifaVendedorId}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, rifaVendedorId: value }))
                      }
                      placeholder="Todos los vendedores"
                      clearable
                      clearLabel="Quitar filtro de vendedor"
                    />
                  </div>
                </div>
                <label className="text-sm">
                  <span className="text-slate-600">Buscar numero</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.numero}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, numero: event.target.value }))
                    }
                    placeholder={selectedRifa ? `Ej: ${'0'.repeat(selectedRifa.numeroCifras)}` : 'Selecciona una rifa'}
                  />
                </label>
              </div>
            </div>

            {filters.rifaId && filters.premioId ? (
              <>
                <form
                  onSubmit={handleSaveJuego}
                  className="theme-section-card rounded-lg p-6 shadow-sm"
                >
                  <div>
                    <h3 className="theme-main-title theme-content-title text-base font-semibold">
                      Registrar boletas que juegan
                    </h3>
                    <p className="theme-content-subtitle text-sm">
                      Define a que premio de la rifa se dirigen esos numeros. Solo puedes poner a jugar boletas que actualmente pertenezcan a ese vendedor.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div>
                      <span className="text-sm text-slate-600">Premio</span>
                      <div className="mt-1">
                        <SearchableSelect
                          options={premioOptions}
                          value={form.premioId}
                          onChange={(value) =>
                            setForm((prev) => ({ ...prev, premioId: value }))
                          }
                          placeholder="Selecciona premio..."
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Vendedor</span>
                      <div className="mt-1">
                        <SearchableSelect
                          options={relationOptions}
                          value={form.rifaVendedorId}
                          onChange={(value) =>
                            setForm((prev) => ({ ...prev, rifaVendedorId: value }))
                          }
                          placeholder="Selecciona vendedor..."
                        />
                      </div>
                    </div>
                    <label className="text-sm">
                      <span className="text-slate-600">Modo</span>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={form.modo}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, modo: event.target.value }))
                        }
                      >
                        <option value="LISTA">Pegar boletas que juegan</option>
                        <option value="TODAS">Jugar todas las boletas</option>
                        <option value="NINGUNA">Quitar todo el juego</option>
                      </select>
                    </label>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="font-medium text-slate-800">Boletas actuales del vendedor</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {selectedRelation?._count?.boletas || 0}
                      </div>
                    </div>
                  </div>

                  {form.modo === 'LISTA' ? (
                    <label className="mt-4 block text-sm">
                      <span className="text-slate-600">Lista de boletas que juegan para este premio</span>
                      <textarea
                        className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={form.numeros}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, numeros: event.target.value }))
                        }
                        placeholder={'Ejemplos:\n0001\n0045\n0789\n\nO tambien:\n0001, 0045, 0789'}
                      />
                    </label>
                  ) : (
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {form.modo === 'TODAS'
                        ? 'Se marcaran como jugando para este premio todas las boletas actuales del vendedor.'
                        : 'Se quitara del premio el juego de todas las boletas actuales del vendedor.'}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={state.saving}
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                    >
                      Guardar juego
                    </button>
                  </div>
                </form>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Rifa</p>
                    <p className="theme-summary-value mt-2 text-base font-semibold">
                      {selectedRifa?.nombre || 'N/D'}
                    </p>
                    <p className="text-sm text-slate-500">{selectedRifa?.loteriaNombre || 'Sin loteria'}</p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Premio</p>
                    <p className="theme-summary-value mt-2 text-base font-semibold">
                      {selectedPremio?.nombre || 'N/D'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedPremio ? formatDateTime(selectedPremio.fecha) : 'Sin fecha'}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Total boletas que juegan</p>
                    <p className="theme-summary-value mt-2 text-2xl font-semibold">
                      {state.resumen?.totalBoletas?.toLocaleString('es-CO') || '0'}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Vendedores visibles</p>
                    <p className="theme-summary-value mt-2 text-2xl font-semibold">
                      {state.resumen?.totalVendedores?.toLocaleString('es-CO') || '0'}
                    </p>
                  </div>
                </div>

                <div className="theme-section-card rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="theme-main-title theme-content-title text-base font-semibold">
                        Boletas que juegan
                      </h3>
                      <p className="theme-content-subtitle text-sm">
                        Este bloque ya esta dirigido al premio seleccionado y muestra nombre, descripcion y fecha de juego.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
                        onClick={handleDownloadExcel}
                        disabled={!state.resumen?.grupos?.length}
                      >
                        Descargar Excel
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
                        onClick={handlePrint}
                        disabled={!state.resumen?.grupos?.length}
                      >
                        Imprimir resumen
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Premio</div>
                      <div className="mt-2 font-semibold text-slate-900">{state.resumen?.premio?.nombre || 'N/D'}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Descripcion</div>
                      <div className="mt-2 text-sm text-slate-700">{state.resumen?.premio?.descripcion || 'Sin descripcion'}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Fecha y hora de juego</div>
                      <div className="mt-2 text-sm text-slate-700">
                        {state.resumen?.premio?.fecha ? formatDateTime(state.resumen.premio.fecha) : 'Sin fecha'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {state.loadingResumen ? (
                      <Loading />
                    ) : state.resumen?.grupos?.length ? (
                      <div className="grid gap-4 xl:grid-cols-3">
                        {state.resumen.grupos.map((group) => (
                          <div
                            key={group.rifaVendedorId}
                            className="rounded-lg border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {group.vendedor?.nombre || 'Sin vendedor'}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Total que juegan: {group.totalBoletas.toLocaleString('es-CO')}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {group.boletas.map((boleta) => (
                                <span
                                  key={boleta.id}
                                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-sm text-indigo-700"
                                >
                                  {boleta.numero}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Sin boletas en juego"
                        description="Todavia no hay boletas jugantes para el premio y filtros actuales."
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="theme-section-card rounded-lg p-6 shadow-sm">
                <EmptyState
                  title="Selecciona una rifa y un premio"
                  description="El modulo de juego trabaja por premio dentro de la rifa para saber exactamente que numeros juegan y para que premio."
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default JuegoPage;
