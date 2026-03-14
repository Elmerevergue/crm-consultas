import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import EmpresaForm from './pages/EmpresaForm';
import EmpresaDetalle from './pages/EmpresaDetalle';
import Categorias from './pages/Categorias';
import Equipo from './pages/Equipo';
import Estadisticas from './pages/Estadisticas';
import { UserProvider } from './context/UserContext';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="empresas"           element={<Empresas />} />
            <Route path="empresas/nueva"     element={<EmpresaForm />} />
            <Route path="empresas/:id"       element={<EmpresaDetalle />} />
            <Route path="empresas/:id/editar" element={<EmpresaForm />} />
            <Route path="categorias"         element={<Categorias />} />
            <Route path="equipo"             element={<Equipo />} />
            <Route path="estadisticas"       element={<Estadisticas />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
