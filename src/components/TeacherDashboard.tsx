import { useEffect, useMemo, useState } from 'react';
import type { Character } from '../types';
import { deleteCharacter, getAllCharacters, setRepresentativeCharacter } from '../services/characterService';
import { getFullParagraph, getTopicSentence } from '../utils/characterText';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

const STUDENT_NUMBERS = Array.from({ length: 23 }, (_, index) => index + 1);

type StudentSummary = {
  count: number;
  representative?: Character;
};

export function TeacherDashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<number | null>(null);

  const loadData = async () => {
    setError('');
    setIsLoading(true);
    try {
      const allCharacters = await getAllCharacters();
      setCharacters(allCharacters);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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

  const summaries = useMemo(
    () => Array.from(summaryMap.entries()).sort((a, b) => a[0] - b[0]),
    [summaryMap],
  );

  const numberStatuses = useMemo(
    () =>
      STUDENT_NUMBERS.map((studentNumber) => ({
        studentNumber,
        count: summaryMap.get(studentNumber)?.count ?? 0,
        representative: summaryMap.get(studentNumber)?.representative,
      })),
    [summaryMap],
  );

  const representativeCount = useMemo(
    () => summaries.filter(([, summary]) => summary.representative).length,
    [summaries],
  );

  const selectedCharacters = useMemo(
    () =>
      selectedStudentNumber === null
        ? []
        : characters.filter((character) => character.student_number === selectedStudentNumber),
    [characters, selectedStudentNumber],
  );

  const handleDelete = async (character: Character) => {
    if (!window.confirm('캐릭터를 삭제할까요?')) return;
    try {
      await deleteCharacter(character.id);
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
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[620px]">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">등록 캐릭터</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{characters.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">참여 번호</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{summaries.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">대표 지정</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{representativeCount}</p>
            </div>
          </div>
          <button
            className="rounded-lg bg-sky-700 px-5 py-3 text-lg font-black text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isLoading}
            onClick={() => void loadData()}
          >
            {isLoading ? '불러오는 중' : '새로고침'}
          </button>
        </div>
      </section>

      {isLoading && <LoadingMessage message="불러오는 중입니다." />}
      <ErrorMessage message={error} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">학생별 제출 현황</p>
            <h2 className="text-2xl font-black text-slate-950">1~23번 상태판</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">대표 지정</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">대표 없음</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">미제출</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {numberStatuses.map(({ studentNumber, count, representative }) => {
            const hasSubmission = count > 0;
            const isSelected = selectedStudentNumber === studentNumber;
            const statusLabel = representative ? '대표 지정' : hasSubmission ? '대표 없음' : '미제출';
            const statusClass = representative
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : hasSubmission
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-500';

            return (
              <button
                key={studentNumber}
                type="button"
                aria-pressed={isSelected}
                className={`rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${statusClass} ${
                  isSelected ? 'border-sky-500 ring-4 ring-sky-100' : ''
                }`}
                onClick={() => setSelectedStudentNumber(studentNumber)}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xl text-slate-950">{studentNumber}번</strong>
                  <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-black">{statusLabel}</span>
                </div>
                <p className="mt-3 text-sm font-bold">
                  <span className="text-lg text-slate-950">{count}</span>개 등록
                </p>
                <p className="mt-1 truncate text-sm font-bold" title={representative?.name ?? ''}>
                  대표: {representative?.name ?? '-'}
                </p>
              </button>
            );
          })}
        </div>

        {selectedStudentNumber !== null && (
          <div className="mt-5 rounded-lg border border-sky-100 bg-sky-50/40 p-4">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">선택한 번호</p>
                <h3 className="text-2xl font-black text-slate-950">{selectedStudentNumber}번 상세 내용</h3>
              </div>
              <p className="text-sm font-bold text-slate-500">{selectedCharacters.length}개 등록</p>
            </div>

            {selectedCharacters.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center font-bold text-slate-500">
                등록된 캐릭터가 없습니다.
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
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">삭제 및 대표 지정</p>
            <h2 className="text-2xl font-black text-slate-950">전체 캐릭터</h2>
          </div>
          <p className="text-sm font-bold text-slate-500">{characters.length}개</p>
        </div>

        {characters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center font-bold text-slate-500">
            표시할 캐릭터가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {characters.map((character) => (
              <div key={character.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-xl text-slate-950">
                        {character.student_number}번 {character.name}
                      </strong>
                      {character.is_representative && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-800">
                          대표
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-lg leading-8 text-slate-700">{getTopicSentence(character)}</p>
                  </div>
                  {renderCharacterActions(character)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
