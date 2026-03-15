import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { remindersAPI } from '../api/client';
import { Reminder, PRIORITY_COLORS, PRIORITY_LABELS } from '../types';
import type { Priority } from '../types';
import Avatar from '../components/Avatar';
import { ChevronLeft, ChevronRight, Bell, Check } from 'lucide-react';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Calendario() {
  const [current, setCurrent] = useState(new Date());
  const year = current.getFullYear();
  const month = current.getMonth();

  const { data: allReminders = [] } = useQuery<Reminder[]>({
    queryKey: ['reminders', {}],
    queryFn: () => remindersAPI.getAll(),
    refetchInterval: 60_000,
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Group reminders by date (YYYY-MM-DD)
  const remindersByDate = useMemo(() => {
    const map: Record<string, Reminder[]> = {};
    allReminders.forEach(r => {
      const d = r.due_date.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(r);
    });
    return map;
  }, [allReminders]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedReminders = selectedDate ? (remindersByDate[selectedDate] ?? []) : [];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => { setCurrent(new Date()); setSelectedDate(todayStr); };

  const cells: Array<{ day: number | null; dateStr: string }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: '' });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Calendario</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Vista mensual de recordatorios</p>
        </div>
        <button className="btn-secondary" onClick={goToday}>Hoy</button>
      </div>

      <div className="card p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prev} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {cells.map((cell, i) => {
            if (cell.day === null) {
              return <div key={`empty-${i}`} className="bg-gray-50 dark:bg-gray-800/50 min-h-[80px]" />;
            }
            const reminders = remindersByDate[cell.dateStr] ?? [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const hasOverdue = reminders.some(r => !r.completed && new Date(r.due_date) < new Date());

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr === selectedDate ? null : cell.dateStr)}
                className={`min-h-[80px] p-1.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {cell.day}
                </div>
                {reminders.length > 0 && (
                  <div className="space-y-0.5">
                    {reminders.slice(0, 3).map(r => (
                      <div
                        key={r.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          r.completed
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 line-through'
                            : hasOverdue
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {r.title}
                      </div>
                    ))}
                    {reminders.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">+{reminders.length - 3} más</p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className="card p-5">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <Bell size={16} className="text-amber-500" />
            Recordatorios del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-GT', { dateStyle: 'long' })}
          </h3>
          {selectedReminders.length === 0 ? (
            <p className="text-sm text-gray-400">Sin recordatorios para esta fecha.</p>
          ) : (
            <div className="space-y-2">
              {selectedReminders.map(r => {
                const pColors = PRIORITY_COLORS[(r.priority || 'media') as Priority];
                return (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg ${r.completed ? 'bg-gray-50 dark:bg-gray-700/50 opacity-60' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${r.completed ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-gray-500'}`}>
                      {r.completed && <Check size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${r.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{r.title}</p>
                      {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${pColors.bg} ${pColors.text}`}>
                          {PRIORITY_LABELS[(r.priority || 'media') as Priority]}
                        </span>
                        {r.empresa_name && <span className="text-xs text-gray-400">{r.empresa_name}</span>}
                        {r.member_name && (
                          <span className="flex items-center gap-1">
                            <Avatar name={r.member_name} color={r.member_color} size="xs" />
                            <span className="text-xs text-gray-400">{r.member_name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
