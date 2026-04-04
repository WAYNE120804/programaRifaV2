import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import BoletaList from './pages/Boletas/BoletaList';
import JuegoPage from './pages/Juego/JuegoPage';
import RifaList from './pages/Rifas/RifaList';
import RifaForm from './pages/Rifas/RifaForm';
import RifaDetail from './pages/Rifas/RifaDetail';
import VendedorList from './pages/Vendedores/VendedorList';
import VendedorForm from './pages/Vendedores/VendedorForm';
import VendedorDetail from './pages/Vendedores/VendedorDetail';
import AsignarBoletas from './pages/Asignaciones/AsignarBoletas';
import HistorialAsignaciones from './pages/Asignaciones/HistorialAsignaciones';
import CrearAbono from './pages/Abonos/CrearAbono';
import HistorialAbonos from './pages/Abonos/HistorialAbonos';
import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
import GastoList from './pages/Gastos/GastoList';
import GastoForm from './pages/Gastos/GastoForm';
import GastoReciboView from './pages/Gastos/GastoReciboView';
import GastoReportView from './pages/Gastos/GastoReportView';
import CajaDashboard from './pages/Caja/CajaDashboard';
import CajaReportView from './pages/Caja/CajaReportView';
import MovimientosCaja from './pages/Caja/MovimientosCaja';
import ConfiguracionPage from './pages/Configuracion/ConfiguracionPage';
import ConfiguracionWebPage from './pages/Configuracion/ConfiguracionWebPage';
import RifaPremiosPage from './pages/Premios/RifaPremiosPage';
import ReciboPublicView from './pages/Recibos/ReciboPublicView';
import ReciboView from './pages/Recibos/ReciboView';
import LoginPage from './pages/Auth/LoginPage';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import PublicHomePage from './pages/Public/PublicHomePage';
import PublicPagoRetornoPage from './pages/Public/PublicPagoRetornoPage';
import PublicRifaPage from './pages/Public/PublicRifaPage';

const HomeRoute = () => {
  const { user } = useAuth();

  if (user?.rol === 'CAJERO') {
    return <Navigate to="/abonos" replace />;
  }

  return <Dashboard />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/publico" element={<PublicHomePage />} />
        <Route path="/publico/rifas/:id" element={<PublicRifaPage />} />
        <Route path="/publico/pago/retorno" element={<PublicPagoRetornoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verificacion/abonos/:codigo" element={<ReciboPublicView />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/boletas" element={<BoletaList />} />
                  <Route path="/juego" element={<JuegoPage />} />
                  <Route path="/rifas" element={<RifaList />} />
                  <Route path="/rifas/crear" element={<RifaForm />} />
                  <Route path="/rifas/:id/editar" element={<RifaForm />} />
                  <Route path="/rifas/:id" element={<RifaDetail />} />
                  <Route path="/rifas/:id/premios" element={<RifaPremiosPage />} />
                  <Route path="/vendedores" element={<VendedorList />} />
                  <Route path="/vendedores/crear" element={<VendedorForm />} />
                  <Route path="/vendedores/:id/editar" element={<VendedorForm />} />
                  <Route path="/vendedores/:id" element={<VendedorDetail />} />
                  <Route path="/asignaciones" element={<AsignarBoletas />} />
                  <Route path="/asignaciones/historial" element={<HistorialAsignaciones />} />
                  <Route path="/devoluciones" element={<DevolucionesPage />} />
                  <Route path="/abonos" element={<HistorialAbonos />} />
                  <Route path="/abonos/crear" element={<CrearAbono />} />
                  <Route
                    path="/gastos"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <GastoList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gastos/crear"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <GastoForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gastos/informe"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <GastoReportView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gasto-recibos/:id"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <GastoReciboView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/caja"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <CajaDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/caja/informe"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <CajaReportView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/caja/movimientos"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <MovimientosCaja />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/usuarios"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <UsuariosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuracion"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ConfiguracionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuracion-web"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ConfiguracionWebPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/recibos/:id" element={<ReciboView />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
