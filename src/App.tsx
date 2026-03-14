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
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200/50 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <UserProvider>
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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UserProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
