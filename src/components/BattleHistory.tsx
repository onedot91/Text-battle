import { useEffect, useMemo, useState } from 'react';
import type { Character } from '../types';
import { getBattleRecordsForStudentNumber, type StudentBattleRecord } from '../services/battleService';
import { getDataLoadErrorMessage } from '../services/serviceErrors';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';
import { situations } from '../data/situations';
import {
  getUnreadIncomingBattleRecords,
  markIncomingBattleRecordsSeen,
} from '../utils/battleNotifications';

type BattleHistoryProps = {
  studentNumber: number;
  onHome: () => void;
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

function getRecordTypeLabel(record: StudentBattleRecord) {
  return record.mySide === 'A' ? '내가 신청한 배틀' : '상대가 신청한 배틀';
}

type BattleCharacterPanelProps = {
  tone: 'sky' | 'rose';
  character: Character | undefined;
  fallbackId: string;
  isWinner: boolean;
};

function BattleCharacterPanel({ tone, character, fallbackId, isWinner }: BattleCharacterPanelProps) {
  const toneClass =
    tone === 'sky'
      ? 'border-sky-100 bg-sky-50 text-sky-700'
      : 'border-rose-100 bg-rose-50 text-rose-700';
  const winnerClass = isWinner ? `${toneClass} battle-history-winner` : toneClass;

  return (
    <div className={`battle-history-character-panel rounded-lg border p-4 ${winnerClass}`}>
      {isWinner && (
        <span className="battle-history-win-chip rounded-full px-3 py-1 text-sm font-black">
          승리
        </span>
      )}
      <p className="battle-history-character-name text-2xl font-black leading-tight text-slate-950">
        {characterLabel(character, fallbackId)}
      </p>
    </div>
  );
}

export function BattleHistory({ studentNumber, onHome }: BattleHistoryProps) {
  const [records, setRecords] = useState<StudentBattleRecord[]>([]);
  const [unreadIncomingRecordIds, setUnreadIncomingRecordIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setError('');
    setIsLoading(true);

    getBattleRecordsForStudentNumber(studentNumber, { includeStory: true, limit: 30 })
      .then((nextRecords) => {
        if (!isMounted) return;
        const unreadRecords = getUnreadIncomingBattleRecords(studentNumber, nextRecords);
        setRecords(nextRecords);
        setUnreadIncomingRecordIds(new Set(unreadRecords.map((record) => record.id)));
        markIncomingBattleRecordsSeen(studentNumber, nextRecords);
      })
      .catch((loadError) => {
        if (isMounted) setError(getDataLoadErrorMessage(loadError));
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-black text-slate-500">{studentNumber}번</p>
          <h1 className="text-3xl font-black text-slate-950">배틀 기록</h1>
        </div>
        <button
          className="rounded-lg bg-slate-950 px-5 py-3 text-lg font-black text-white transition hover:bg-slate-800"
          type="button"
          onClick={onHome}
        >
          홈으로 가기
        </button>
      </header>

      {isLoading && <LoadingMessage message="기록을 불러오는 중입니다." />}
      <ErrorMessage message={error} />

      {!isLoading && records.length === 0 && !error && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-black text-slate-600">아직 저장된 배틀 기록이 없습니다.</p>
          <p className="mt-2 text-base font-bold text-slate-500">
            내가 신청한 배틀과 상대가 내 캐릭터에게 신청한 배틀이 함께 표시됩니다.
          </p>
        </section>
      )}

      <div className="space-y-4">
        {records.map((record) => {
          const isUnreadIncoming = unreadIncomingRecordIds.has(record.id);
          const situationTitle = situationTitleById.get(record.situation_id) || '배틀 상황';
          const isAWinner = record.winner_character_id === record.character_a_id;
          const isBWinner = record.winner_character_id === record.character_b_id;

          return (
            <article
              key={record.id}
              className={`overflow-hidden rounded-lg border bg-white shadow-sm ${
                isUnreadIncoming ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {isUnreadIncoming && (
                    <span className="rounded-full bg-rose-600 px-3 py-1 text-sm font-black text-white">알림</span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-black ${
                      record.mySide === 'A'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {getRecordTypeLabel(record)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 ring-1 ring-slate-200">
                    {formatDate(record.created_at)}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-500">{situationTitle}</div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                <BattleCharacterPanel
                  tone="sky"
                  character={record.characterA}
                  fallbackId={record.character_a_id}
                  isWinner={isAWinner}
                />

                <div className="flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-2xl font-black text-white">
                  VS
                </div>

                <BattleCharacterPanel
                  tone="rose"
                  character={record.characterB}
                  fallbackId={record.character_b_id}
                  isWinner={isBWinner}
                />
              </div>

              <div className="px-5 pb-5">
                <p className="story-copy whitespace-pre-line break-keep rounded-lg bg-white p-4 text-lg font-semibold leading-9 text-slate-800 ring-1 ring-slate-200">
                  {record.story || '이야기 본문을 불러오지 못했습니다.'}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
