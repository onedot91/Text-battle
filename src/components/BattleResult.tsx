import type { BattleResult as BattleResultType, Character, Situation } from '../types';

type BattleResultProps = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

export function BattleResult({ characterA, characterB, situation, result }: BattleResultProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black text-sky-950">
          {characterA.name} VS {characterB.name}
        </h2>
        {result.usedFallback && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-lg font-bold text-amber-900">
            임시 결과{result.fallbackReason ? `: ${result.fallbackReason}` : ''}
          </p>
        )}
      </section>

      <section className="rounded-lg border-2 border-sky-100 bg-white p-6">
        <h3 className="text-2xl font-black text-sky-900">상황</h3>
        <p className="mt-3 text-xl leading-8">{situation.text}</p>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900">이야기</h3>
        <p className="mt-3 text-xl leading-9">{result.story}</p>
      </section>

      <section className="rounded-lg border-4 border-yellow-200 bg-yellow-50 p-6">
        <h3 className="text-2xl font-black text-yellow-950">승리</h3>
        <p className="mt-3 text-3xl font-black text-yellow-900">{result.winnerName}</p>
        <p className="mt-4 text-xl leading-8">{result.reason}</p>
      </section>
    </div>
  );
}
