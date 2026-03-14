import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { TeamMember } from '../types';

interface AuthCtx {
  user: User | null;
  member: TeamMember | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, role?: string, color?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  member: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch linked team member
  const fetchMember = async (authId: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('auth_id', authId)
      .single();
    setMember(data ?? null);
    return data;
  };

  // Listen to auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchMember(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchMember(s.user.id);
      } else {
        setMember(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateError(error.message) };
    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string, role = 'Asesor', color = '#3B82F6') => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (authError) return { error: translateError(authError.message) };
    if (!authData.user) return { error: 'No se pudo crear la cuenta.' };

    // 2. Check if team member with this email already exists
    const { data: existing } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      // Link existing team member to this auth account
      await supabase
        .from('team_members')
        .update({ auth_id: authData.user.id })
        .eq('id', existing.id);
    } else {
      // Create new team member linked to auth
      await supabase.from('team_members').insert({
        name,
        email,
        role,
        color,
        auth_id: authData.user.id,
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ user, member, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos.';
  if (msg.includes('already registered')) return 'Este email ya tiene una cuenta. Inicia sesión.';
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('valid email')) return 'Ingresa un email válido.';
  if (msg.includes('Email rate limit')) return 'Demasiados intentos. Espera un momento.';
  return msg;
}
