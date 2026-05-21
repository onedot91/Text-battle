import { supabase } from '../lib/supabase';
import type { Character, CharacterInput } from '../types';

export async function getCharactersByStudentNumber(studentNumber: number) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('student_number', studentNumber)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Character[];
}

export async function getAllCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('student_number', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Character[];
}

export async function createCharacter(input: CharacterInput) {
  const existing = await getCharactersByStudentNumber(input.student_number);
  const { data, error } = await supabase
    .from('characters')
    .insert({ ...input, is_representative: existing.length === 0 })
    .select()
    .single();
  if (error) throw error;
  return { character: data as Character, becameRepresentative: existing.length === 0 };
}

export async function updateCharacter(characterId: string, updates: Partial<CharacterInput> & { is_representative?: boolean }) {
  const { data, error } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', characterId)
    .select()
    .single();
  if (error) throw error;
  return data as Character;
}

export async function setRepresentativeCharacter(studentNumber: number, characterId: string) {
  const reset = await supabase
    .from('characters')
    .update({ is_representative: false })
    .eq('student_number', studentNumber);
  if (reset.error) throw reset.error;

  const selected = await supabase
    .from('characters')
    .update({ is_representative: true })
    .eq('id', characterId)
    .eq('student_number', studentNumber)
    .select()
    .single();
  if (selected.error) throw selected.error;
  return selected.data as Character;
}

export async function deleteCharacter(characterId: string) {
  const { data: character, error: getError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();
  if (getError) throw getError;

  const { error } = await supabase.from('characters').delete().eq('id', characterId);
  if (error) throw error;

  if ((character as Character).is_representative) {
    const remaining = await getCharactersByStudentNumber((character as Character).student_number);
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
    .maybeSingle();
  if (error) throw error;
  return data as Character | null;
}
