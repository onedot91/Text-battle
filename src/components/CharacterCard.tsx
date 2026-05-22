import type { Character } from '../types';
import { getFullParagraph } from '../utils/characterText';

export type CharacterBattleStats = {
  wins: number;
  losses: number;
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

  return (
    <article className="rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-black text-slate-900">{character.name}</h3>
        {character.is_representative && (
          <span className="rounded-full bg-yellow-200 px-4 py-2 text-base font-black text-yellow-900">대표</span>
        )}
        <span className="rounded-full bg-slate-100 px-4 py-2 text-base font-black text-slate-700">
          {totalBattles > 0 ? `승 ${battleStats?.wins ?? 0} · 패 ${battleStats?.losses ?? 0}` : '전적 없음'}
        </span>
      </div>
      <p className="rounded-lg bg-slate-50 p-4 text-lg leading-8">{getFullParagraph(character)}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {onSetRepresentative && !character.is_representative && (
          <button
            className="rounded-lg bg-yellow-500 px-5 py-3 text-lg font-bold text-white hover:bg-yellow-600"
            onClick={() => onSetRepresentative(character)}
          >
            대표로 정하기
          </button>
        )}
        {onEdit && (
          <button
            className="rounded-lg bg-emerald-600 px-5 py-3 text-lg font-bold text-white hover:bg-emerald-700"
            onClick={() => onEdit(character)}
          >
            수정
          </button>
        )}
        {onDelete && (
          <button
            className="rounded-lg bg-red-600 px-5 py-3 text-lg font-bold text-white hover:bg-red-700"
            onClick={() => onDelete(character)}
          >
            삭제
          </button>
        )}
      </div>
    </article>
  );
}
