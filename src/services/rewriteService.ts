import {
  addDoc,
  collection,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CharacterFieldName, RewriteLog, RewriteLogInput } from '../types';

const rewriteLogsCollection = collection(db, 'rewrite_logs');

function timestampToString(value: Timestamp | string | null | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function toRewriteLog(snapshot: QueryDocumentSnapshot<DocumentData>): RewriteLog {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    character_id: String(data.character_id || ''),
    student_number: Number(data.student_number),
    field_name: data.field_name as CharacterFieldName,
    before_text: String(data.before_text || ''),
    after_text: String(data.after_text || ''),
    created_at: timestampToString(data.created_at),
  };
}

export async function createRewriteLog(log: RewriteLogInput) {
  const reference = await addDoc(rewriteLogsCollection, {
    ...log,
    created_at: serverTimestamp(),
  });
  return {
    id: reference.id,
    ...log,
    created_at: new Date().toISOString(),
  };
}

export async function getRewriteLogsByCharacter(characterId: string) {
  const snapshot = await getDocs(
    query(rewriteLogsCollection, where('character_id', '==', characterId), orderBy('created_at', 'desc')),
  );
  return snapshot.docs.map(toRewriteLog);
}

export async function getRecentRewriteLogs(limit = 10) {
  const snapshot = await getDocs(
    query(rewriteLogsCollection, orderBy('created_at', 'desc'), firestoreLimit(limit)),
  );
  return snapshot.docs.map(toRewriteLog);
}
