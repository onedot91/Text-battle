import { supabase } from '../lib/supabase';
import type { Character, CharacterInput } from '../types';

export const MAX_CHARACTERS_PER_STUDENT = 6;
export const DAILY_CHARACTER_DELETE_LIMIT_PER_STUDENT = 1;
const CHARACTER_DELETE_LOG_STORAGE_PREFIX = 'text-battle-character-delete-log';

function getLocalDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

async function getCharacterById(characterId: string) {
  const { data, error } = await supabase.from('characters').select('*').eq('id', characterId).single();
  if (error || !data) throw new Error('Character not found.');
  return data;
}

function isMissingSubjectParticleColumn(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { message?: string; details?: string; hint?: string };
  return [maybeError.message, maybeError.details, maybeError.hint].some((value) =>
    value?.includes('subject_particle'),
  );
}

function withoutSubjectParticle(input: Partial<CharacterInput>) {
  const { subject_particle: _subjectParticle, ...rest } = input;
  return rest;
}

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

function getLocalDeletionLogKey(studentNumber: number) {
  return `${CHARACTER_DELETE_LOG_STORAGE_PREFIX}-${studentNumber}`;
}

function getLocalTodayDeletionCount(studentNumber: number) {
  if (typeof window === 'undefined') return 0;

  const { startIso, endIso } = getLocalDayRange();
  const rawValue = window.localStorage.getItem(getLocalDeletionLogKey(studentNumber));
  if (!rawValue) return 0;

  try {
    const createdAtValues = JSON.parse(rawValue) as string[];
    return createdAtValues.filter((createdAt) => createdAt >= startIso && createdAt < endIso).length;
  } catch {
    return 0;
  }
}

function recordLocalCharacterDeletion(studentNumber: number) {
  if (typeof window === 'undefined') return;

  const { startIso, endIso } = getLocalDayRange();
  const rawValue = window.localStorage.getItem(getLocalDeletionLogKey(studentNumber));
  let createdAtValues: string[] = [];

  try {
    createdAtValues = rawValue ? (JSON.parse(rawValue) as string[]) : [];
  } catch {
    createdAtValues = [];
  }

  const recentValues = createdAtValues.filter((createdAt) => createdAt >= startIso && createdAt < endIso);
  window.localStorage.setItem(getLocalDeletionLogKey(studentNumber), JSON.stringify([...recentValues, new Date().toISOString()]));
}

export async function getCharactersByStudentNumber(studentNumber: number) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('student_number', studentNumber)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAllCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('student_number', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCharacter(input: CharacterInput) {
  const existing = await getCharactersByStudentNumber(input.student_number);
  if (existing.length >= MAX_CHARACTERS_PER_STUDENT) {
    throw new Error(`한 번호당 캐릭터는 ${MAX_CHARACTERS_PER_STUDENT}개까지 등록할 수 있습니다.`);
  }

  const isRepresentative = existing.length === 0;

  const result = await supabase
    .from('characters')
    .insert({ ...input, is_representative: isRepresentative })
    .select()
    .single();

  if (result.error && isMissingSubjectParticleColumn(result.error)) {
    const fallbackResult = await supabase
      .from('characters')
      .insert({ ...withoutSubjectParticle(input), is_representative: isRepresentative } as never)
      .select()
      .single();
    if (fallbackResult.error) throw fallbackResult.error;
    return {
      character: fallbackResult.data,
      becameRepresentative: isRepresentative,
    };
  }

  if (result.error) throw result.error;
  return {
    character: result.data,
    becameRepresentative: isRepresentative,
  };
}

export async function updateCharacter(characterId: string, updates: Partial<CharacterInput> & { is_representative?: boolean }) {
  const existing = await getCharacterById(characterId);

  const result = await supabase
    .from('characters')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', characterId)
    .select()
    .single();

  if (result.error && isMissingSubjectParticleColumn(result.error)) {
    const fallbackResult = await supabase
      .from('characters')
      .update({
        ...withoutSubjectParticle(updates),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', characterId)
      .select()
      .single();
    if (fallbackResult.error) throw fallbackResult.error;
    return {
      ...withoutSubjectParticle(updates),
      ...existing,
      ...fallbackResult.data,
    };
  }

  if (result.error) throw result.error;
  return {
    ...updates,
    ...existing,
    ...result.data,
  };
}

export async function setRepresentativeCharacter(studentNumber: number, characterId: string) {
  const { data, error } = await supabase.rpc('set_representative_character', {
    p_student_number: studentNumber,
    p_character_id: characterId,
  });
  if (error || !data) throw new Error('Representative character not found.');
  return data;
}

export async function getTodayCharacterDeletionCount(studentNumber: number) {
  const { startIso, endIso } = getLocalDayRange();
  const { count, error } = await supabase
    .from('character_deletion_logs')
    .select('id', { count: 'exact', head: true })
    .eq('student_number', studentNumber)
    .gte('created_at', startIso)
    .lt('created_at', endIso);

  if (error) {
    if (isMissingDeletionLogTable(error)) return getLocalTodayDeletionCount(studentNumber);
    throw error;
  }
  return Math.max(count ?? 0, getLocalTodayDeletionCount(studentNumber));
}

export async function getRemainingDailyCharacterDeletions(studentNumber: number) {
  const todayDeleteCount = await getTodayCharacterDeletionCount(studentNumber);
  return Math.max(0, DAILY_CHARACTER_DELETE_LIMIT_PER_STUDENT - todayDeleteCount);
}

export async function deleteCharacter(characterId: string) {
  const character = await getCharacterById(characterId);
  const todayDeleteCount = await getTodayCharacterDeletionCount(character.student_number);

  if (todayDeleteCount >= DAILY_CHARACTER_DELETE_LIMIT_PER_STUDENT) {
    throw new Error('CHARACTER_DELETE_DAILY_LIMIT_REACHED');
  }

  const { error } = await supabase.from('characters').delete().eq('id', characterId);
  if (error) throw error;

  const logResult = await supabase.from('character_deletion_logs').insert({
    student_number: character.student_number,
    deleted_character_id: character.id,
    character_name: character.name,
  });
  if (logResult.error) {
    if (isMissingDeletionLogTable(logResult.error)) {
      recordLocalCharacterDeletion(character.student_number);
    } else {
      throw logResult.error;
    }
  }

  if (character.is_representative) {
    const remaining = await getCharactersByStudentNumber(character.student_number);
    if (remaining.length > 0) {
      await setRepresentativeCharacter(remaining[0].student_number, remaining[0].id);
    }
  }
}

export async function getRepresentativeCharacter(studentNumber: number) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('student_number', studentNumber)
    .eq('is_representative', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRandomBattleOpponentCandidates(studentNumber: number) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_representative', true)
    .neq('student_number', studentNumber)
    .order('student_number', { ascending: true });
  if (error) throw error;
  return data;
}
