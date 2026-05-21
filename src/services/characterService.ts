import { supabase } from '../lib/supabase';
import type { Character, CharacterInput } from '../types';

async function getCharacterById(characterId: string) {
  const { data, error } = await supabase.from('characters').select('*').eq('id', characterId).single();
  if (error || !data) throw new Error('Character not found.');
  return data;
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
  const isRepresentative = existing.length === 0;
  const { data, error } = await supabase
    .from('characters')
    .insert({ ...input, is_representative: isRepresentative })
    .select()
    .single();
  if (error) throw error;
  return {
    character: data,
    becameRepresentative: isRepresentative,
  };
}

export async function updateCharacter(characterId: string, updates: Partial<CharacterInput> & { is_representative?: boolean }) {
  const existing = await getCharacterById(characterId);
  const { data, error } = await supabase
    .from('characters')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', characterId)
    .select()
    .single();
  if (error) throw error;
  return {
    ...updates,
    ...existing,
    ...data,
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

export async function deleteCharacter(characterId: string) {
  const character = await getCharacterById(characterId);

  const { error } = await supabase.from('characters').delete().eq('id', characterId);
  if (error) throw error;

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
