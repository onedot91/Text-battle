import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('characters').select('id').limit(1);
  if (error) throw error;
}
