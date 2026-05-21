import { supabase } from '../lib/supabase';
import type { BattleRecord, BattleRecordInput, BattleResult, Character, Situation } from '../types';

export async function generateBattleWithGemini(characterA: Character, characterB: Character, situation: Situation) {
  const { data, error } = await supabase.functions.invoke<BattleResult>('generate-battle', {
    body: { characterA, characterB, situation },
  });
  if (error) throw error;
  if (!data) throw new Error('배틀 이야기를 만들지 못했습니다.');
  return data;
}

export async function createBattleRecord(record: BattleRecordInput) {
  const { data, error } = await supabase.from('battle_records').insert(record).select().single();
  if (error) throw error;
  return data as BattleRecord;
}

export async function getRecentBattleRecords(limit = 10) {
  const { data, error } = await supabase
    .from('battle_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as BattleRecord[];
}
