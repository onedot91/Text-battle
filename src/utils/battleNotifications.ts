import type { StudentBattleRecord } from '../services/battleService';

const storageKey = (studentNumber: number) => `text-battle-seen-incoming-records-${studentNumber}`;

function readSeenIncomingRecordIds(studentNumber: number) {
  try {
    const rawValue = window.localStorage.getItem(storageKey(studentNumber));
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

function writeSeenIncomingRecordIds(studentNumber: number, recordIds: Set<string>) {
  window.localStorage.setItem(storageKey(studentNumber), JSON.stringify(Array.from(recordIds)));
}

export function isUnreadIncomingBattleRecord(studentNumber: number, record: StudentBattleRecord) {
  return record.mySide === 'B' && !readSeenIncomingRecordIds(studentNumber).has(record.id);
}

export function getUnreadIncomingBattleRecords(studentNumber: number, records: StudentBattleRecord[]) {
  const seenRecordIds = readSeenIncomingRecordIds(studentNumber);
  return records.filter((record) => record.mySide === 'B' && !seenRecordIds.has(record.id));
}

export function markIncomingBattleRecordsSeen(studentNumber: number, records: StudentBattleRecord[]) {
  const seenRecordIds = readSeenIncomingRecordIds(studentNumber);
  records.forEach((record) => {
    if (record.mySide === 'B') {
      seenRecordIds.add(record.id);
    }
  });
  writeSeenIncomingRecordIds(studentNumber, seenRecordIds);
}
