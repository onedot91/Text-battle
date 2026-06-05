import { supabase } from '../lib/supabase';

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

function isMissingDeletionLogTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
  return (
    maybeError.code === '42P01' ||
    [maybeError.message, maybeError.details, maybeError.hint].some((value) =>
      value?.includes('character_deletion_logs'),
    )
  );
}

export async function resetAllClassroomData() {
  const deletionLogResult = await supabase.from('character_deletion_logs').delete().neq('id', EMPTY_UUID);
  if (deletionLogResult.error && !isMissingDeletionLogTable(deletionLogResult.error)) {
    throw deletionLogResult.error;
  }

  const battleResult = await supabase.from('battle_records').delete().neq('id', EMPTY_UUID);
  if (battleResult.error) throw battleResult.error;

  const characterResult = await supabase.from('characters').delete().neq('id', EMPTY_UUID);
  if (characterResult.error) throw characterResult.error;
}
