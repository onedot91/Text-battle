import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function checkFirestoreConnection() {
  await getDocs(query(collection(db, 'characters'), limit(1)));
}
