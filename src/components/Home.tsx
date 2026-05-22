import { useEffect, useState } from 'react';
import type { Character } from '../types';
import { getRepresentativeCharacter } from '../services/characterService';
import { getBattleRecordsForStudentNumber } from '../services/battleService';
import { getUnreadIncomingBattleRecords } from '../utils/battleNotifications';

type HomeProps = {
  studentNumber: number;
  onNavigate: (view: 'form' | 'book' | 'battle' | 'history') => void;
};

export function Home({ studentNumber, onNavigate }: HomeProps) {
  const [representative, setRepresentative] = useState<Character | null>(null);
  const [incomingBattleCount, setIncomingBattleCount] = useState(0);
  const [isLoadingRepresentative, setIsLoadingRepresentative] = useState(false);
  const [isBattleReady, setIsBattleReady] = useState(false);

  useEffect(() => {
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

  return (
    <div className="home-shell">
      <section className="home-board mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="home-command-grid grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_12rem] lg:items-stretch">
          <div className="home-number-card rounded-lg border-2 border-slate-200 bg-slate-50 p-5">
            <p className="block text-base font-black text-slate-500">
              번호
            </p>
            <div className="mt-3 grid grid-cols-[1fr_3rem] overflow-hidden rounded-lg border-2 border-slate-200 bg-white">
              <div className="flex h-20 min-w-0 items-center justify-center px-3 text-center text-5xl font-black text-slate-950">
                {studentNumber}
              </div>
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
