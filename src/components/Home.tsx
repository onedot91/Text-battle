import { useEffect, useState } from 'react';
import type { Character } from '../types';
import { getRepresentativeCharacter } from '../services/characterService';
import { getBattleRecordsForStudentNumber } from '../services/battleService';
import { getUnreadIncomingBattleRecords } from '../utils/battleNotifications';

type HomeProps = {
  studentNumber: number;
  onStudentNumberChange: (studentNumber: number) => void;
  onNavigate: (view: 'form' | 'book' | 'battle' | 'history') => void;
};

const MIN_STUDENT_NUMBER = 1;
const MAX_STUDENT_NUMBER = 23;

export function Home({ studentNumber, onStudentNumberChange, onNavigate }: HomeProps) {
  const [studentNumberInput, setStudentNumberInput] = useState(String(studentNumber));
  const [representative, setRepresentative] = useState<Character | null>(null);
  const [incomingBattleCount, setIncomingBattleCount] = useState(0);
  const [isLoadingRepresentative, setIsLoadingRepresentative] = useState(false);
  const [isBattleReady, setIsBattleReady] = useState(false);

  useEffect(() => {
    setStudentNumberInput(String(studentNumber));
    setIsBattleReady(false);
  }, [studentNumber]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingRepresentative(true);

    Promise.all([
      getRepresentativeCharacter(studentNumber),
      getBattleRecordsForStudentNumber(studentNumber),
    ])
      .then(([character, records]) => {
        if (!isMounted) return;
        setRepresentative(character);
        setIncomingBattleCount(getUnreadIncomingBattleRecords(studentNumber, records).length);
      })
      .catch(() => {
        if (!isMounted) return;
        setRepresentative(null);
        setIncomingBattleCount(0);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRepresentative(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentNumber]);

  const updateStudentNumber = (nextNumber: number) => {
    if (Number.isInteger(nextNumber) && nextNumber >= MIN_STUDENT_NUMBER && nextNumber <= MAX_STUDENT_NUMBER) {
      onStudentNumberChange(nextNumber);
    }
  };

  const handleStudentNumberInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 2);
    setStudentNumberInput(digitsOnly);

    const nextNumber = Number(digitsOnly);
    if (digitsOnly && nextNumber >= MIN_STUDENT_NUMBER && nextNumber <= MAX_STUDENT_NUMBER) {
      updateStudentNumber(nextNumber);
    }
  };

  return (
    <div className="home-shell">
      <section className="home-board mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="home-command-grid grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_12rem] lg:items-stretch">
          <div className="home-number-card rounded-lg border-2 border-slate-200 bg-slate-50 p-5">
            <label className="block text-base font-black text-slate-500" htmlFor="student-number-input">
              번호
            </label>
            <div className="mt-3 grid grid-cols-[1fr_3rem] overflow-hidden rounded-lg border-2 border-slate-200 bg-white focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
              <input
                id="student-number-input"
                className="h-20 min-w-0 px-3 text-center text-5xl font-black text-slate-950 outline-none"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={studentNumberInput}
                onBlur={() => setStudentNumberInput(String(studentNumber))}
                onChange={(event) => handleStudentNumberInput(event.target.value)}
              />
              <div className="flex items-center justify-center border-l-2 border-slate-200 bg-slate-50 text-xl font-black text-slate-600">
                번
              </div>
            </div>
          </div>

          <div className="versus-matchup grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="matchup-card matchup-card-left rounded-lg border-2 border-sky-100 bg-sky-50 p-6">
              <p className="text-base font-black text-sky-700">내 캐릭터</p>
              <p className="matchup-name mt-5 text-5xl font-black text-slate-950">
                {isLoadingRepresentative ? '확인 중' : representative?.name || '없음'}
              </p>
            </div>

            <button
              className={`versus-badge flex items-center justify-center rounded-lg bg-slate-950 px-5 py-4 text-3xl font-black text-white ${
                isBattleReady ? 'versus-badge-ready' : ''
              }`}
              type="button"
              onClick={() => {
                if (isBattleReady) {
                  onNavigate('battle');
                  return;
                }
                setIsBattleReady(true);
              }}
            >
              {isBattleReady ? '배틀 시작' : 'VS'}
            </button>

            <div className="matchup-card matchup-card-right rounded-lg border-2 border-rose-100 bg-rose-50 p-6">
              <p className="text-base font-black text-rose-700">상대</p>
              <p className="matchup-name mt-5 text-5xl font-black text-slate-950">???</p>
            </div>
          </div>

        </div>

        <div className="home-nav-grid mt-4 grid gap-3 sm:grid-cols-3">
          <button
            className="rounded-lg border-2 border-slate-200 bg-white px-5 py-4 text-xl font-black text-slate-900 transition hover:border-slate-400"
            onClick={() => onNavigate('form')}
          >
            캐릭터 등록
          </button>
          <button
            className="rounded-lg border-2 border-slate-200 bg-white px-5 py-4 text-xl font-black text-slate-900 transition hover:border-slate-400"
            onClick={() => onNavigate('book')}
          >
            캐릭터 보기
          </button>
          <button
            className="rounded-lg border-2 border-slate-200 bg-white px-5 py-4 text-xl font-black text-slate-900 transition hover:border-slate-400"
            onClick={() => onNavigate('history')}
          >
            기록 보기
            {incomingBattleCount > 0 && (
              <span className="ml-2 rounded-full bg-rose-600 px-2.5 py-1 text-sm font-black text-white">
                새 알림 {incomingBattleCount}
              </span>
            )}
          </button>
        </div>

        {incomingBattleCount > 0 && (
          <button
            className="mt-4 flex w-full flex-col gap-1 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-left transition hover:border-rose-300 hover:bg-rose-100"
            type="button"
            onClick={() => onNavigate('history')}
          >
            <span className="text-lg font-black text-rose-900">
              새 배틀 신청 {incomingBattleCount}개
            </span>
            <span className="text-base font-bold text-rose-800">
              누군가 {studentNumber}번 캐릭터에게 배틀을 신청했습니다.
            </span>
          </button>
        )}

        {!representative && !isLoadingRepresentative && (
          <div className="mt-4 rounded-lg bg-amber-50 px-5 py-4 text-lg font-black text-amber-900">
            대표 캐릭터가 필요합니다.
          </div>
        )}
      </section>
    </div>
  );
}
