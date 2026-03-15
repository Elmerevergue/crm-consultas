import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { member } = useAuth();

  useEffect(() => {
    if (!member) return;

    // Listen for new activities
    const actChannel = supabase
      .channel('activities-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, (payload) => {
        const act = payload.new;
        // Only notify if it's not from the current user
        if (act.team_member_id !== member.id) {
          toast('Nueva actividad registrada', 'info');
        }
        qc.invalidateQueries({ queryKey: ['stats'] });
        qc.invalidateQueries({ queryKey: ['empresa'] });
      })
      .subscribe();

    // Listen for empresa changes (assignments, status changes)
    const empChannel = supabase
      .channel('empresas-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'empresas' }, (payload) => {
        const emp = payload.new;
        const old = payload.old;
        // Notify if assigned to current user
        if (emp.assigned_to === member.id && old.assigned_to !== member.id) {
          toast(`Te asignaron: ${emp.company_name}`, 'warning');
        }
        // Notify status change
        if (emp.status !== old.status) {
          qc.invalidateQueries({ queryKey: ['empresas'] });
          qc.invalidateQueries({ queryKey: ['stats'] });
        }
      })
      .subscribe();

    // Listen for new reminders assigned to current user
    const remChannel = supabase
      .channel('reminders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reminders' }, (payload) => {
        const rem = payload.new;
        if (rem.team_member_id === member.id) {
          toast(`Nuevo recordatorio: ${rem.title}`, 'warning');
        }
        qc.invalidateQueries({ queryKey: ['reminders'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(actChannel);
      supabase.removeChannel(empChannel);
      supabase.removeChannel(remChannel);
    };
  }, [member?.id]);
}
