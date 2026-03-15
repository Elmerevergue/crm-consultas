import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Tag, Users, BarChart3,
  Menu, X, Columns, Bell, Moon, Sun,
  Briefcase, LogOut, CalendarDays, MessageSquare,
  DollarSign, WifiOff,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { remindersAPI } from '../api/client';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/empresas',      icon: Building2,       label: 'Clientes' },
  { to: '/kanban',        icon: Columns,         label: 'Kanban' },
  { to: '/recordatorios', icon: Bell,            label: 'Recordatorios' },
  { to: '/calendario',    icon: CalendarDays,    label: 'Calendario' },
  { to: '/pagos',         icon: DollarSign,      label: 'Pagos' },
  { to: '/servicios',     icon: Briefcase,       label: 'Servicios' },
  { to: '/plantillas',    icon: MessageSquare,   label: 'Plantillas' },
  { to: '/categorias',    icon: Tag,             label: 'Categorías' },
  { to: '/equipo',        icon: Users,           label: 'Equipo' },
  { to: '/estadisticas',  icon: BarChart3,       label: 'Estadísticas' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const { currentUser } = useCurrentUser();
  const { dark, toggle } = useTheme();
  const { signOut } = useAuth();

  // Subscribe to realtime notifications
  useRealtimeNotifications();

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Count pending reminders for badge
  const { data: pendingReminders = [] } = useQuery({
    queryKey: ['reminders', { completed: false }],
    queryFn: () => remindersAPI.getAll({ completed: false }),
    refetchInterval: 60_000,
  });

  const overdueCount = pendingReminders.filter(
    (r: { due_date: string }) => new Date(r.due_date) < new Date()
  ).length;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
     ${isActive
       ? 'bg-blue-600 text-white'
       : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 dark:bg-gray-950 flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Control Clientes</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {to === '/recordatorios' && overdueCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
              {to === '/recordatorios' && overdueCount === 0 && pendingReminders.length > 0 && (
                <span className="w-5 h-5 bg-slate-600 text-slate-300 text-xs rounded-full flex items-center justify-center">
                  {pendingReminders.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-3 border-t border-slate-700 space-y-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>

          {/* Current user info */}
          {currentUser && (
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors text-sm"
          >
            <LogOut size={16} />
            Cerrar sesión
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
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 px-4 lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {offline && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
              <WifiOff size={13} /> Sin conexión
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
              <Bell size={14} />
              {overdueCount} vencido{overdueCount > 1 ? 's' : ''}
            </div>
          )}
          {currentUser && (
            <div className="flex items-center gap-2">
              <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{currentUser.name}</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
