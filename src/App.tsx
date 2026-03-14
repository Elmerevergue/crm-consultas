import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import EmpresaForm from './pages/EmpresaForm';
import EmpresaDetalle from './pages/EmpresaDetalle';
import Kanban from './pages/Kanban';
import Recordatorios from './pages/Recordatorios';
import Categorias from './pages/Categorias';
import Servicios from './pages/Servicios';
import Equipo from './pages/Equipo';
import Estadisticas from './pages/Estadisticas';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
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
              <Route path="kanban"             element={<Kanban />} />
              <Route path="recordatorios"      element={<Recordatorios />} />
              <Route path="categorias"         element={<Categorias />} />
              <Route path="servicios"          element={<Servicios />} />
              <Route path="equipo"             element={<Equipo />} />
              <Route path="estadisticas"       element={<Estadisticas />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}
