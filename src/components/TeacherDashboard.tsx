import { useEffect, useMemo, useState } from 'react';
import type { Character } from '../types';
import { deleteCharacter, getAllCharacters, setRepresentativeCharacter } from '../services/characterService';
import { getTopicSentence } from '../utils/characterText';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

export function TeacherDashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const summaries = useMemo(() => {
    const map = new Map<number, { count: number; representative?: Character }>();
    characters.forEach((character) => {
      const current = map.get(character.student_number) || { count: 0 };
      current.count += 1;
      if (character.is_representative) current.representative = character;
      map.set(character.student_number, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [characters]);

  const representativeCount = useMemo(
    () => summaries.filter(([, summary]) => summary.representative).length,
    [summaries],
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
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">학생별 제출 현황</p>
            <h2 className="text-2xl font-black text-slate-950">번호별</h2>
          </div>
          <p className="text-sm font-bold text-slate-500">{summaries.length}명</p>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center font-bold text-slate-500">
            아직 등록된 캐릭터가 없습니다.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {summaries.map(([studentNumber, summary]) => (
              <div
                key={studentNumber}
                className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[120px_1fr_160px] sm:items-center"
              >
                <strong className="text-xl text-slate-950">{studentNumber}번</strong>
                <div className="text-lg text-slate-700">
                  <span className="font-bold text-slate-950">{summary.count}개</span> 등록
                </div>
                <div className="text-base font-bold text-slate-600">
                  대표: {summary.representative ? summary.representative.name : '없음'}
                </div>
              </div>
            ))}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
