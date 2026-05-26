import type { Character } from '../types';
import { DAILY_BATTLE_LIMIT_PER_CHARACTER } from '../services/battleService';
import { getFullParagraph } from '../utils/characterText';

export type CharacterBattleStats = {
  wins: number;
  losses: number;
  currentWinStreak: number;
  remainingDailyBattles: number;
};

type CharacterCardProps = {
  character: Character;
  battleStats?: CharacterBattleStats;
  onSetRepresentative?: (character: Character) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
};

export function CharacterCard({ character, battleStats, onSetRepresentative, onEdit, onDelete }: CharacterCardProps) {
  const totalBattles = (battleStats?.wins ?? 0) + (battleStats?.losses ?? 0);
  const remainingDailyBattles = battleStats?.remainingDailyBattles ?? DAILY_BATTLE_LIMIT_PER_CHARACTER;

  return (
    <article
      className={`character-card rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm ${
        character.is_representative ? 'character-card-representative' : ''
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-black text-slate-900">{character.name}</h3>
        {character.is_representative && (
          <span className="rounded-full bg-yellow-200 px-4 py-2 text-base font-black text-yellow-900">대표</span>
        )}
        <span className="rounded-full bg-slate-100 px-4 py-2 text-base font-black text-slate-700">
          {totalBattles > 0 ? `승 ${battleStats?.wins ?? 0} · 패 ${battleStats?.losses ?? 0}` : '전적 없음'}
        </span>
        <span
          className={`rounded-full px-4 py-2 text-base font-black ${
            remainingDailyBattles > 0 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          오늘 {remainingDailyBattles}/{DAILY_BATTLE_LIMIT_PER_CHARACTER}회
        </span>
        {(battleStats?.currentWinStreak ?? 0) >= 2 && (
          <span className="rounded-full bg-amber-300 px-4 py-2 text-base font-black text-amber-950">
            {battleStats?.currentWinStreak}연승 중
          </span>
        )}
      </div>
      <p className="story-copy rounded-lg bg-slate-50 p-4 text-lg leading-8">{getFullParagraph(character)}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {onSetRepresentative && !character.is_representative && (
          <button
            className="rounded-lg bg-yellow-500 px-5 py-3 text-lg font-bold text-white hover:bg-yellow-600"
            type="button"
            onClick={() => onSetRepresentative(character)}
          >
            대표로 정하기
          </button>
        )}
        {onEdit && (
          <button
            className="rounded-lg bg-emerald-600 px-5 py-3 text-lg font-bold text-white hover:bg-emerald-700"
            type="button"
            onClick={() => onEdit(character)}
          >
            수정
          </button>
        )}
        {onDelete && (
          <button
            className="rounded-lg bg-red-600 px-5 py-3 text-lg font-bold text-white hover:bg-red-700"
            type="button"
            onClick={() => onDelete(character)}
          >
            삭제
          </button>
        )}
      </div>
    </article>
  );
}
