import { useCallback, useEffect, useRef, useState } from 'react';
import type { BattleResult as BattleResultType, Character, Situation } from '../types';
import { playTypeSound, playWinnerSound } from '../utils/soundEffects';

type BattleResultProps = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
  onHome: () => void;
  onComplete?: () => void;
};

const TYPE_SPEED_MS = 135;

export function BattleResult({ characterA, characterB, situation, result, onHome, onComplete }: BattleResultProps) {
  const [visibleStory, setVisibleStory] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const typingCursorRef = useRef<HTMLSpanElement | null>(null);
  const winnerSoundStoryRef = useRef('');

  const revealWinner = useCallback(() => {
    setIsComplete(true);
    onComplete?.();
    if (winnerSoundStoryRef.current !== result.story) {
      winnerSoundStoryRef.current = result.story;
      playWinnerSound();
    }
  }, [onComplete, result.story]);

  useEffect(() => {
    const storyCharacters = Array.from(result.story);

    setVisibleStory('');
    setIsComplete(false);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleStory(result.story);
      revealWinner();
      return;
    }

    let index = 0;
    const timerId = window.setInterval(() => {
      index += 1;
      playTypeSound();
      setVisibleStory(storyCharacters.slice(0, index).join(''));

      if (index >= storyCharacters.length) {
        window.clearInterval(timerId);
        revealWinner();
      }
    }, TYPE_SPEED_MS);

    return () => window.clearInterval(timerId);
  }, [result.story, revealWinner]);

  useEffect(() => {
    if (isComplete) return;

    if (!visibleStory) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      typingCursorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [visibleStory, isComplete]);

  useEffect(() => {
    if (isComplete) return;

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };
    const preventScrollKeys = (event: KeyboardEvent) => {
      const scrollKeys = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' ']);
      if (scrollKeys.has(event.key)) event.preventDefault();
    };

    window.addEventListener('wheel', preventScroll, { capture: true, passive: false });
    window.addEventListener('touchmove', preventScroll, { capture: true, passive: false });
    window.addEventListener('keydown', preventScrollKeys, { capture: true });

    return () => {
      window.removeEventListener('wheel', preventScroll, { capture: true });
      window.removeEventListener('touchmove', preventScroll, { capture: true });
      window.removeEventListener('keydown', preventScrollKeys, { capture: true });
    };
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isComplete]);

  return (
    <div className="space-y-6">
      <section className="result-summary-section rounded-lg bg-white p-6 shadow-sm">
        <div className="result-matchup flex flex-wrap items-center gap-4">
          <div className="result-contender flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full border border-black/20 bg-sky-50 px-4 py-2 text-lg font-black text-sky-950">
              {characterA.student_number}번
            </span>
            <h2 className="result-name text-3xl font-black text-sky-950">{characterA.name}</h2>
          </div>
          <span className="result-vs text-2xl font-black text-slate-400">VS</span>
          <div className="result-contender flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full border border-black/20 bg-rose-50 px-4 py-2 text-lg font-black text-rose-950">
              {characterB.student_number}번
            </span>
            <h2 className="result-name text-3xl font-black text-rose-950">{characterB.name}</h2>
          </div>
        </div>
        {result.usedFallback && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-lg font-bold text-amber-900">
            임시 결과로 보여줘요.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border-2 border-emerald-100 bg-white p-6 sm:flex-row sm:items-center">
        <span className="w-fit rounded-full border border-black/20 bg-emerald-50 px-4 py-2 text-lg font-black text-emerald-950">
          상황
        </span>
        <p className="text-2xl font-black leading-8 text-slate-950">{situation.title}</p>
      </section>

      <section
        className={`result-story-section ${isComplete ? 'is-complete' : 'is-typing'} flex flex-col rounded-lg border-4 border-yellow-200 bg-yellow-50 px-7 py-8 shadow-sm sm:px-12 sm:py-10`}
      >
        <p className="story-copy max-w-[64em] whitespace-pre-line break-keep text-xl font-semibold leading-[2.05] text-slate-950 sm:text-[1.55rem] sm:leading-[2]">
          {visibleStory}
          {!isComplete && (
            <span ref={typingCursorRef} className="ml-1 inline-block h-6 w-1 translate-y-1 animate-pulse bg-yellow-900" />
          )}
        </p>

        {isComplete && (
          <div className="winner-reveal mt-10 border-t-2 border-yellow-200 pt-6 text-right opacity-0 animate-[winnerFadeIn_700ms_ease-out_forwards]">
            <div className="winner-burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="winner-reveal-header">
              <p className="winner-reveal-label text-base font-black text-yellow-950 sm:text-lg">승리 캐릭터</p>
            </div>
            <p className="winner-name text-4xl font-black leading-tight text-yellow-900 sm:text-5xl">{result.winnerName}</p>
          </div>
        )}
      </section>

      {isComplete && (
        <div className="flex justify-end">
          <button
            className="rounded-lg bg-slate-950 px-7 py-4 text-xl font-black text-white transition hover:bg-slate-800"
            type="button"
            onClick={onHome}
          >
            홈으로 가기
          </button>
        </div>
      )}
    </div>
  );
}
