import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Tag, Users, BarChart3,
  Menu, X, ChevronDown, LogIn,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { equipoAPI } from '../api/client';
import { TeamMember } from '../types';
import { useCurrentUser } from '../context/UserContext';
import Avatar from './Avatar';
import Modal from './Modal';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/empresas',     icon: Building2,       label: 'Empresas' },
  { to: '/categorias',   icon: Tag,             label: 'Categorías' },
  { to: '/equipo',       icon: Users,           label: 'Equipo' },
  { to: '/estadisticas', icon: BarChart3,       label: 'Estadísticas' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const { currentUser, setCurrentUser } = useCurrentUser();

  const { data: members = [] } = useQuery<TeamMember[]>({
    queryKey: ['equipo'],
    queryFn: equipoAPI.getAll,
  });

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
     ${isActive
       ? 'bg-blue-600 text-white'
       : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">CRM Pro</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Current user picker */}
        <div className="px-4 py-4 border-t border-slate-700">
          <button
            onClick={() => setUserPickerOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            {currentUser ? (
              <>
                <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <LogIn size={14} className="text-slate-400" />
                </div>
                <span className="text-sm text-slate-400 flex-1 text-left">Seleccionar usuario</span>
              </>
            )}
            <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {currentUser && (
            <div className="flex items-center gap-2">
              <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{currentUser.name}</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Modal selector de usuario */}
      <Modal open={userPickerOpen} onClose={() => setUserPickerOpen(false)} title="¿Quién eres?">
        <p className="text-sm text-gray-500 mb-4">
          Selecciona tu nombre para registrar tu actividad correctamente.
        </p>
        <div className="space-y-2">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => { setCurrentUser(m); setUserPickerOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors
                ${currentUser?.id === m.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <Avatar name={m.name} color={m.color} />
              <div className="text-left">
                <p className="font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.role}</p>
              </div>
              {currentUser?.id === m.id && (
                <span className="ml-auto text-blue-600 text-xs font-medium">Activo</span>
              )}
            </button>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay miembros del equipo. Ve a <strong>Equipo</strong> para agregar.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
