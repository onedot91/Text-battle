import { useEffect, useMemo, useState } from 'react';
import type { Character } from '../types';
import { getBattleRecordsForStudentNumber, type StudentBattleRecord } from '../services/battleService';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';
import { situations } from '../data/situations';
import {
  getUnreadIncomingBattleRecords,
  markIncomingBattleRecordsSeen,
} from '../utils/battleNotifications';

type BattleHistoryProps = {
  studentNumber: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function characterLabel(character: Character | undefined, fallbackId: string) {
  if (!character) return `삭제된 캐릭터 (${fallbackId.slice(0, 8)})`;
  return `${character.student_number}번 ${character.name}`;
}

export function BattleHistory({ studentNumber }: BattleHistoryProps) {
  const [records, setRecords] = useState<StudentBattleRecord[]>([]);
  const [unreadIncomingRecordIds, setUnreadIncomingRecordIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setError('');
    setIsLoading(true);

    getBattleRecordsForStudentNumber(studentNumber)
      .then((nextRecords) => {
        if (!isMounted) return;
        const unreadRecords = getUnreadIncomingBattleRecords(studentNumber, nextRecords);
        setRecords(nextRecords);
        setUnreadIncomingRecordIds(new Set(unreadRecords.map((record) => record.id)));
        markIncomingBattleRecordsSeen(studentNumber, nextRecords);
      })
      .catch(() => {
        if (isMounted) setError('기록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentNumber]);

  const situationTitleById = useMemo(
    () => new Map(situations.map((situation) => [situation.id, situation.title])),
    [],
  );

  const incomingRecordCount = unreadIncomingRecordIds.size;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">내 캐릭터 배틀 기록</p>
            <h2 className="text-3xl font-black text-slate-950">{studentNumber}번 기록 보기</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-black">
            {incomingRecordCount > 0 && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">알림 {incomingRecordCount}</span>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{records.length}개</span>
          </div>
        </div>
      </section>

      {isLoading && <LoadingMessage message="기록을 불러오는 중입니다." />}
      <ErrorMessage message={error} />

      {!isLoading && records.length === 0 && !error && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-black text-slate-600">아직 저장된 배틀 기록이 없습니다.</p>
          <p className="mt-2 text-base font-bold text-slate-500">
            내가 배틀을 시작한 기록과 다른 사람이 내 캐릭터와 배틀한 기록이 여기에 함께 표시됩니다.
          </p>
        </section>
      )}

      <div className="space-y-4">
        {records.map((record) => {
          const winnerLabel = characterLabel(record.winnerCharacter, record.winner_character_id);
          const situationTitle = situationTitleById.get(record.situation_id) || '배틀 상황';
          const isIncoming = unreadIncomingRecordIds.has(record.id);

          return (
            <article
              key={record.id}
              className={`rounded-lg border bg-white p-5 shadow-sm ${
                isIncoming ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isIncoming && (
                      <span className="rounded-full bg-rose-600 px-3 py-1 text-sm font-black text-white">
                        알림
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black ${
                        record.mySide === 'A'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {record.mySide === 'A' ? '내가 배틀함' : '상대가 내 캐릭터와 배틀'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
                      {formatDate(record.created_at)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                    {characterLabel(record.characterA, record.character_a_id)}
                    <span className="mx-3 text-slate-400">VS</span>
                    {characterLabel(record.characterB, record.character_b_id)}
                  </h3>
                  <p className="mt-2 text-base font-bold text-slate-500">{situationTitle}</p>
                </div>
                <div className="rounded-lg bg-yellow-50 px-4 py-3 text-left lg:text-right">
                  <p className="text-sm font-black text-yellow-800">승리 캐릭터</p>
                  <p className="mt-1 text-xl font-black text-yellow-950">{winnerLabel}</p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-lg font-semibold leading-8 text-slate-800">
                {record.story}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
