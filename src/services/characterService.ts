import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Character, CharacterInput } from '../types';

const charactersCollection = collection(db, 'characters');

function timestampToString(value: Timestamp | string | null | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function toCharacter(snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Character {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    student_number: Number(data.student_number),
    name: String(data.name || ''),
    ability_blank: String(data.ability_blank || ''),
    support1_blank: String(data.support1_blank || ''),
    support2_blank: String(data.support2_blank || ''),
    support3_blank: String(data.support3_blank || ''),
    is_representative: Boolean(data.is_representative),
    created_at: timestampToString(data.created_at),
    updated_at: timestampToString(data.updated_at),
  };
}

async function getCharacterById(characterId: string) {
  const snapshot = await getDoc(doc(db, 'characters', characterId));
  if (!snapshot.exists()) throw new Error('Character not found.');
  return toCharacter(snapshot);
}

function createOptimisticCharacter(id: string, input: CharacterInput, isRepresentative: boolean): Character {
  const now = new Date().toISOString();
  return {
    id,
    ...input,
    is_representative: isRepresentative,
    created_at: now,
    updated_at: now,
  };
}

export async function getCharactersByStudentNumber(studentNumber: number) {
  const snapshot = await getDocs(
    query(charactersCollection, where('student_number', '==', studentNumber), orderBy('created_at', 'asc')),
  );
  return snapshot.docs.map(toCharacter);
}

export async function getAllCharacters() {
  const snapshot = await getDocs(
    query(charactersCollection, orderBy('student_number', 'asc'), orderBy('created_at', 'asc')),
  );
  return snapshot.docs.map(toCharacter);
}

export async function createCharacter(input: CharacterInput) {
  const existing = await getCharactersByStudentNumber(input.student_number);
  const isRepresentative = existing.length === 0;
  const reference = await addDoc(charactersCollection, {
    ...input,
    is_representative: isRepresentative,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return {
    character: createOptimisticCharacter(reference.id, input, isRepresentative),
    becameRepresentative: isRepresentative,
  };
}

export async function updateCharacter(characterId: string, updates: Partial<CharacterInput> & { is_representative?: boolean }) {
  const existing = await getCharacterById(characterId);
  await updateDoc(doc(db, 'characters', characterId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
  return {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
}

export async function setRepresentativeCharacter(studentNumber: number, characterId: string) {
  const snapshot = await getDocs(query(charactersCollection, where('student_number', '==', studentNumber)));
  const selected = snapshot.docs.find((item) => item.id === characterId);
  if (!selected) throw new Error('Representative character not found.');

  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => {
    batch.update(item.ref, {
      is_representative: item.id === characterId,
      updated_at: serverTimestamp(),
    });
  });
  await batch.commit();
  return getCharacterById(characterId);
}

export async function deleteCharacter(characterId: string) {
  const character = await getCharacterById(characterId);

  await deleteDoc(doc(db, 'characters', characterId));

  if (character.is_representative) {
    const remaining = await getCharactersByStudentNumber(character.student_number);
    if (remaining.length > 0) {
      await setRepresentativeCharacter(remaining[0].student_number, remaining[0].id);
    }
  }
}

export async function getRepresentativeCharacter(studentNumber: number) {
  const snapshot = await getDocs(
    query(
      charactersCollection,
      where('student_number', '==', studentNumber),
      where('is_representative', '==', true),
    ),
  );
  return snapshot.empty ? null : toCharacter(snapshot.docs[0]);
}
