import { useEffect, useState } from 'react';
import type { BattleResult as BattleResultType, Character, Situation } from '../types';

type BattleResultProps = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

const TYPE_SPEED_MS = 70;

export function BattleResult({ characterA, characterB, situation, result }: BattleResultProps) {
  const [visibleStory, setVisibleStory] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const winnerCharacter = result.winner === 'A' ? characterA : characterB;

  useEffect(() => {
    const storyCharacters = Array.from(result.story);

    setVisibleStory('');
    setIsComplete(false);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleStory(result.story);
      setIsComplete(true);
      return;
    }

    let index = 0;
    const timerId = window.setInterval(() => {
      index += 1;
      setVisibleStory(storyCharacters.slice(0, index).join(''));

      if (index >= storyCharacters.length) {
        window.clearInterval(timerId);
        setIsComplete(true);
      }
    }, TYPE_SPEED_MS);

    return () => window.clearInterval(timerId);
  }, [result.story]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full bg-sky-100 px-4 py-2 text-lg font-black text-sky-900">
              {characterA.student_number}번
            </span>
            <h2 className="truncate text-3xl font-black text-sky-950">{characterA.name}</h2>
          </div>
          <span className="text-2xl font-black text-slate-400">VS</span>
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full bg-rose-100 px-4 py-2 text-lg font-black text-rose-900">
              {characterB.student_number}번
            </span>
            <h2 className="truncate text-3xl font-black text-rose-950">{characterB.name}</h2>
          </div>
        </div>
        {result.usedFallback && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-lg font-bold text-amber-900">
            임시 결과{result.fallbackReason ? `: ${result.fallbackReason}` : ''}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border-2 border-sky-100 bg-white p-6 sm:flex-row sm:items-center">
        <span className="w-fit rounded-full bg-sky-100 px-4 py-2 text-lg font-black text-sky-900">
          상황
        </span>
        <p className="text-2xl font-black leading-8 text-slate-950">{situation.title}</p>
      </section>

      <section className="flex min-h-[500px] flex-col justify-between rounded-lg border-4 border-yellow-200 bg-yellow-50 px-7 py-8 shadow-sm sm:min-h-[560px] sm:px-12 sm:py-10">
        <p className="max-w-[64em] whitespace-pre-line break-keep text-xl font-semibold leading-[2.05] text-slate-950 sm:text-[1.55rem] sm:leading-[2]">
          {visibleStory}
          {!isComplete && <span className="ml-1 inline-block h-6 w-1 translate-y-1 animate-pulse bg-yellow-900" />}
        </p>

        <div
          className={`mt-10 border-t-2 border-yellow-200 pt-6 text-right transition-all duration-700 ${
            isComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          aria-hidden={!isComplete}
        >
          <p className="text-base font-black text-yellow-950 sm:text-lg">승리 캐릭터</p>
          <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
            <span className="rounded-full bg-yellow-200 px-4 py-2 text-lg font-black text-yellow-950">
              {winnerCharacter.student_number}번
            </span>
            <p className="text-4xl font-black leading-tight text-yellow-900 sm:text-5xl">{result.winnerName}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
