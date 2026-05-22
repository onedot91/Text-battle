import { supabase } from '../lib/supabase';

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

export async function resetAllClassroomData() {
  const rewriteResult = await supabase.from('rewrite_logs').delete().neq('id', EMPTY_UUID);
  if (rewriteResult.error) throw rewriteResult.error;

  const battleResult = await supabase.from('battle_records').delete().neq('id', EMPTY_UUID);
  if (battleResult.error) throw battleResult.error;

  const characterResult = await supabase.from('characters').delete().neq('id', EMPTY_UUID);
  if (characterResult.error) throw characterResult.error;
}
