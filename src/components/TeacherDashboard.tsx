import { useEffect, useMemo, useState } from 'react';
import type { Character } from '../types';
import {
  deleteCharacter,
  getAllCharacters,
  MAX_CHARACTERS_PER_STUDENT,
  setRepresentativeCharacter,
} from '../services/characterService';
import { getAllBattleRecords, type TeacherBattleRecord } from '../services/battleService';
import { situations } from '../data/situations';
import { getFullParagraph } from '../utils/characterText';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

const STUDENT_NUMBERS = Array.from({ length: 24 }, (_, index) => index);

type StudentSummary = {
  count: number;
  representative?: Character;
};

type TeacherDashboardProps = {
  refreshKey: number;
  onLoadingChange: (isLoading: boolean) => void;
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

export function TeacherDashboard({ refreshKey, onLoadingChange }: TeacherDashboardProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [battleRecords, setBattleRecords] = useState<TeacherBattleRecord[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<number | null>(null);

  const loadData = async () => {
    setError('');
    setIsLoading(true);
    onLoadingChange(true);
    try {
      const [allCharacters, allBattleRecords] = await Promise.all([getAllCharacters(), getAllBattleRecords()]);
      setCharacters(allCharacters);
      setBattleRecords(allBattleRecords);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [refreshKey]);

  const summaryMap = useMemo(() => {
    const map = new Map<number, StudentSummary>();
    characters.forEach((character) => {
      const current = map.get(character.student_number) || { count: 0 };
      current.count += 1;
      if (character.is_representative) current.representative = character;
      map.set(character.student_number, current);
    });
    return map;
  }, [characters]);

  const numberStatuses = useMemo(
    () =>
      STUDENT_NUMBERS.map((studentNumber) => ({
        studentNumber,
        count: summaryMap.get(studentNumber)?.count ?? 0,
        representative: summaryMap.get(studentNumber)?.representative,
      })),
    [summaryMap],
  );

  const selectedCharacters = useMemo(
    () =>
      selectedStudentNumber === null
        ? []
        : characters.filter((character) => character.student_number === selectedStudentNumber),
    [characters, selectedStudentNumber],
  );

  const situationTitleById = useMemo(
    () => new Map(situations.map((situation) => [situation.id, situation.title])),
    [],
  );

  const handleDelete = async (character: Character) => {
    if (!window.confirm('캐릭터를 삭제할까요?')) return;
    try {
      await deleteCharacter(character.id, { bypassDailyLimit: true });
      await loadData();
    } catch {
      setError('캐릭터를 삭제하지 못했습니다.');
    }
  };

  const handleRepresentative = async (character: Character) => {
    try {
      await setRepresentativeCharacter(character.student_number, character.id);
      await loadData();
    } catch {
      setError('대표 캐릭터를 정하지 못했습니다.');
    }
  };

  const renderCharacterActions = (character: Character) => (
    <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
      {!character.is_representative && (
        <button
          className="rounded-lg bg-amber-500 px-4 py-2 font-black text-white hover:bg-amber-600"
          onClick={() => void handleRepresentative(character)}
        >
          대표로 지정
        </button>
      )}
      <button
        className="rounded-lg bg-red-600 px-4 py-2 font-black text-white hover:bg-red-700"
        onClick={() => void handleDelete(character)}
      >
        삭제
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading && <LoadingMessage message="불러오는 중입니다." />}
      <ErrorMessage message={error} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-950">상태판</h2>
          <p className="text-sm font-black text-slate-500">0-23</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {numberStatuses.map(({ studentNumber, count, representative }) => {
            const hasSubmission = count > 0;
            const isSelected = selectedStudentNumber === studentNumber;
            const statusLabel = representative ? '대표' : hasSubmission ? '대기' : '-';
            const statusClass = representative
              ? 'border-emerald-200 bg-emerald-50'
              : hasSubmission
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-200 bg-slate-50';
            const badgeClass = representative
              ? 'bg-emerald-100 text-emerald-800'
              : hasSubmission
                ? 'bg-amber-100 text-amber-800'
                : 'bg-white text-slate-400';

            return (
              <button
                key={studentNumber}
                type="button"
                aria-pressed={isSelected}
                className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${statusClass} ${
                  isSelected ? 'border-sky-500 ring-4 ring-sky-100' : ''
                }`}
                onClick={() =>
                  setSelectedStudentNumber((currentStudentNumber) =>
                    currentStudentNumber === studentNumber ? null : studentNumber,
                  )
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xl text-slate-950">
                    {studentNumber}번{' '}
                    <span className="text-base font-black text-slate-500">
                      ({count}/{MAX_CHARACTERS_PER_STUDENT})
                    </span>
                  </strong>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-black ${badgeClass}`}>{statusLabel}</span>
                </div>
                <p className="mt-1 min-h-5 truncate text-sm font-bold text-slate-600" title={representative?.name ?? ''}>
                  {representative?.name ?? ''}
                </p>
              </button>
            );
          })}
        </div>

        {selectedStudentNumber !== null && (
          <div className="mt-5 rounded-lg border border-sky-100 bg-sky-50/40 p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h3 className="text-2xl font-black text-slate-950">{selectedStudentNumber}번</h3>
              <p className="text-sm font-black text-slate-500">{selectedCharacters.length}</p>
            </div>

            {selectedCharacters.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center font-bold text-slate-500">
                없음
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCharacters.map((character) => (
                  <div key={character.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-xl text-slate-950">{character.name}</strong>
                          {character.is_representative && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-800">
                              대표
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-lg leading-8 text-slate-700">{getFullParagraph(character)}</p>
                      </div>
                      {renderCharacterActions(character)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">배틀 결과 아카이브</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">저장된 모든 배틀 결과를 최신순으로 봅니다.</p>
          </div>
          <p className="text-sm font-black text-slate-500">총 {battleRecords.length}개</p>
        </div>

        {battleRecords.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center font-bold text-slate-500">
            아직 저장된 배틀 결과가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {battleRecords.map((record) => {
              const situationTitle = situationTitleById.get(record.situation_id) || '배틀 상황';
              const isAWinner = record.winner_character_id === record.character_a_id;
              const isBWinner = record.winner_character_id === record.character_b_id;

              return (
                <article key={record.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 ring-1 ring-slate-200">
                        {formatDate(record.created_at)}
                      </span>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">
                        {situationTitle}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-500">기록 ID {record.id.slice(0, 8)}</p>
                  </div>

                  <div className="grid gap-3 p-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                    <div
                      className={`rounded-lg border p-4 ${
                        isAWinner ? 'border-emerald-200 bg-emerald-50' : 'border-sky-100 bg-sky-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {isAWinner && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                            승리
                          </span>
                        )}
                        <strong className="text-xl text-slate-950">
                          {characterLabel(record.characterA, record.character_a_id)}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-xl font-black text-white">
                      VS
                    </div>

                    <div
                      className={`rounded-lg border p-4 ${
                        isBWinner ? 'border-emerald-200 bg-emerald-50' : 'border-rose-100 bg-rose-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {isBWinner && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                            승리
                          </span>
                        )}
                        <strong className="text-xl text-slate-950">
                          {characterLabel(record.characterB, record.character_b_id)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <p className="story-copy whitespace-pre-line break-keep rounded-lg bg-white p-4 text-lg font-semibold leading-8 text-slate-800 ring-1 ring-slate-200">
                      {record.story}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
