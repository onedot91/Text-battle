import { useEffect, useState } from 'react';
import type { Character } from '../types';
import { getRepresentativeCharacter } from '../services/characterService';

type HomeProps = {
  studentNumber: number;
  onStudentNumberChange: (studentNumber: number) => void;
  onNavigate: (view: 'form' | 'book' | 'battle') => void;
};

const MIN_STUDENT_NUMBER = 1;
const MAX_STUDENT_NUMBER = 23;

export function Home({ studentNumber, onStudentNumberChange, onNavigate }: HomeProps) {
  const [studentNumberInput, setStudentNumberInput] = useState(String(studentNumber));
  const [representative, setRepresentative] = useState<Character | null>(null);
  const [isLoadingRepresentative, setIsLoadingRepresentative] = useState(false);

  useEffect(() => {
    setStudentNumberInput(String(studentNumber));
  }, [studentNumber]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingRepresentative(true);
    getRepresentativeCharacter(studentNumber)
      .then((character) => {
        if (isMounted) setRepresentative(character);
      })
      .catch(() => {
        if (isMounted) setRepresentative(null);
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
    <div className="min-h-[calc(100vh-132px)]">
      <section className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_12rem] lg:items-stretch">
          <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-5">
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

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="rounded-lg border-2 border-sky-100 bg-sky-50 p-6">
              <p className="text-base font-black text-sky-700">내 캐릭터</p>
              <p className="mt-5 truncate text-5xl font-black text-slate-950">
                {isLoadingRepresentative ? '확인 중' : representative?.name || '없음'}
              </p>
            </div>

            <div className="flex items-center justify-center rounded-lg bg-slate-950 px-5 py-4 text-3xl font-black text-white">
              VS
            </div>

            <div className="rounded-lg border-2 border-rose-100 bg-rose-50 p-6">
              <p className="text-base font-black text-rose-700">상대</p>
              <p className="mt-5 text-5xl font-black text-slate-950">랜덤</p>
            </div>
          </div>

          <button
            className="rounded-lg bg-rose-600 px-5 py-6 text-3xl font-black text-white transition hover:bg-rose-700"
            onClick={() => onNavigate('battle')}
          >
            배틀 시작
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </div>

        {!representative && !isLoadingRepresentative && (
          <div className="mt-4 rounded-lg bg-amber-50 px-5 py-4 text-lg font-black text-amber-900">
            대표 캐릭터가 필요합니다.
          </div>
        )}
      </section>
    </div>
  );
}
