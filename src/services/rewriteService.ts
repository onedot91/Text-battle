import { supabase } from '../lib/supabase';
import type { RewriteLog, RewriteLogInput } from '../types';

export async function createRewriteLog(log: RewriteLogInput) {
  const { data, error } = await supabase.from('rewrite_logs').insert(log).select().single();
  if (error) throw error;
  return data as RewriteLog;
}

export async function getRewriteLogsByCharacter(characterId: string) {
  const { data, error } = await supabase
    .from('rewrite_logs')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as RewriteLog[];
}

export async function getRecentRewriteLogs(limit = 10) {
  const { data, error } = await supabase
    .from('rewrite_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as RewriteLog[];
}
