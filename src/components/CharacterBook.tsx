import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Character } from '../types';
import {
  deleteCharacter,
  getCharactersByStudentNumber,
  MAX_CHARACTERS_PER_STUDENT,
  setRepresentativeCharacter,
} from '../services/characterService';
import {
  getBattleRecordsForStudentNumber,
  getRemainingDailyBattlesForCharacter,
  type StudentBattleRecord,
} from '../services/battleService';
import { getCurrentWinStreakForCharacter } from '../utils/battleStreaks';
import { CharacterCard, type CharacterBattleStats } from './CharacterCard';
import { CharacterForm } from './CharacterForm';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

type CharacterBookProps = {
  initialStudentNumber?: number;
  onHome: () => void;
};

const CHARACTER_SLOTS = Array.from({ length: MAX_CHARACTERS_PER_STUDENT }, (_, index) => index);

function buildBattleStatsByCharacterId(records: StudentBattleRecord[]) {
  const stats = new Map<string, CharacterBattleStats>();

  const ensureStats = (characterId: string) => {
    const current = stats.get(characterId) || { wins: 0, losses: 0, currentWinStreak: 0, remainingDailyBattles: 0 };
    stats.set(characterId, current);
    return current;
  };

  records.forEach((record) => {
    const characterIds = [record.character_a_id, record.character_b_id];

    characterIds.forEach((characterId) => {
      const current = ensureStats(characterId);
      if (record.winner_character_id === characterId) {
        current.wins += 1;
      } else {
        current.losses += 1;
      }
    });
  });

  stats.forEach((current, characterId) => {
    current.currentWinStreak = getCurrentWinStreakForCharacter(characterId, records);
    current.remainingDailyBattles = getRemainingDailyBattlesForCharacter(characterId, records);
  });

  return stats;
}

export function CharacterBook({ initialStudentNumber = 1, onHome }: CharacterBookProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [battleRecords, setBattleRecords] = useState<StudentBattleRecord[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadCharacters = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const [nextCharacters, nextBattleRecords] = await Promise.all([
        getCharactersByStudentNumber(initialStudentNumber),
        getBattleRecordsForStudentNumber(initialStudentNumber),
      ]);
      setCharacters(nextCharacters);
      setBattleRecords(nextBattleRecords);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [initialStudentNumber]);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  const battleStatsByCharacterId = useMemo(
    () => buildBattleStatsByCharacterId(battleRecords),
    [battleRecords],
  );

  const slots = useMemo(
    () => CHARACTER_SLOTS.map((slotIndex) => characters[slotIndex] ?? null),
    [characters],
  );

  const handleSetRepresentative = async (character: Character) => {
    try {
      await setRepresentativeCharacter(character.student_number, character.id);
      await loadCharacters();
    } catch {
      setError('대표 캐릭터를 정하지 못했습니다.');
    }
  };

  const handleDelete = async (character: Character) => {
    if (!window.confirm('이 캐릭터를 삭제할까요?')) return;
    try {
      await deleteCharacter(character.id);
      await loadCharacters();
    } catch {
      setError('캐릭터를 삭제하지 못했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-black text-slate-500">{initialStudentNumber}번</p>
          <h1 className="text-3xl font-black text-slate-950">내 캐릭터</h1>
        </div>
        <button
          className="rounded-lg bg-slate-950 px-5 py-3 text-lg font-black text-white transition hover:bg-slate-800"
          type="button"
          onClick={onHome}
        >
          홈으로 가기
        </button>
      </header>

      <ErrorMessage message={error} />
      {isLoading && <LoadingMessage message="불러오는 중" />}
      {editing && (
        <CharacterForm
          editingCharacter={editing}
          onSaved={() => {
            setEditing(null);
            void loadCharacters();
          }}
        />
      )}
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-500">캐릭터 슬롯</p>
            <h2 className="text-2xl font-black text-slate-950">
              {characters.length}/{MAX_CHARACTERS_PER_STUDENT}개 등록
            </h2>
          </div>
          {characters.length >= MAX_CHARACTERS_PER_STUDENT && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-black text-rose-800">
              등록 한도 도달
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {slots.map((character, index) =>
            character ? (
              <CharacterCard
                key={character.id}
                character={character}
                battleStats={battleStatsByCharacterId.get(character.id)}
                onSetRepresentative={handleSetRepresentative}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ) : (
              <div
                key={`empty-${index}`}
                className="flex min-h-[220px] flex-col justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center"
              >
                <p className="text-lg font-black text-slate-500">빈 캐릭터 칸</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
