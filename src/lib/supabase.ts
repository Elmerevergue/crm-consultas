import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL  as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.\n' +
    'Crea un archivo .env en la raíz del frontend con esos valores.\n' +
    'Ver .env.example para referencia.'
  );
}

export const supabase = createClient(url, key);
