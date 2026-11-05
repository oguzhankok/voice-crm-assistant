import { createClient } from '@supabase/supabase-js';

// Vite projelerinde .env değişkenlerine import.meta.env ile erişilir
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL veya Anon Key .env dosyasında bulunamadı!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);