import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env;
const supabaseUrl = process.env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Database operations will fail.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
