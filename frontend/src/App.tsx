import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
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
import RifaPremiosPage from './pages/Premios/RifaPremiosPage';
import ReciboPublicView from './pages/Recibos/ReciboPublicView';
import ReciboView from './pages/Recibos/ReciboView';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verificacion/abonos/:codigo" element={<ReciboPublicView />} />
        <Route
          path="*"
          element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
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
                <Route path="/gastos" element={<GastoList />} />
                <Route path="/gastos/crear" element={<GastoForm />} />
                <Route path="/gastos/informe" element={<GastoReportView />} />
                <Route path="/gasto-recibos/:id" element={<GastoReciboView />} />
                <Route path="/caja" element={<CajaDashboard />} />
                <Route path="/caja/informe" element={<CajaReportView />} />
                <Route path="/caja/movimientos" element={<MovimientosCaja />} />
                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/recibos/:id" element={<ReciboView />} />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
