import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Character } from '../types';
import {
  DAILY_CHARACTER_DELETE_LIMIT_PER_STUDENT,
  deleteCharacter,
  getCharactersByStudentNumber,
  getRemainingDailyCharacterDeletions,
  MAX_CHARACTERS_PER_STUDENT,
  setRepresentativeCharacter,
} from '../services/characterService';
import {
  getBattleRecordsForStudentNumber,
  getRemainingDailyBattlesForCharacter,
  type StudentBattleRecord,
} from '../services/battleService';
import { getDataLoadErrorMessage } from '../services/serviceErrors';
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
  const [remainingDailyDeletions, setRemainingDailyDeletions] = useState(DAILY_CHARACTER_DELETE_LIMIT_PER_STUDENT);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  const scrollEditFormIntoView = () => {
    editFormRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const loadCharacters = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const [nextCharacters, nextBattleRecords, nextRemainingDailyDeletions] = await Promise.all([
        getCharactersByStudentNumber(initialStudentNumber),
        getBattleRecordsForStudentNumber(initialStudentNumber, { includeStory: false, limit: 200 }),
        getRemainingDailyCharacterDeletions(initialStudentNumber),
      ]);
      setCharacters(nextCharacters);
      setBattleRecords(nextBattleRecords);
      setRemainingDailyDeletions(nextRemainingDailyDeletions);
    } catch (loadError) {
      setError(getDataLoadErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [initialStudentNumber]);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    if (!editing) return;

    scrollEditFormIntoView();
  }, [editing]);

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

  const handleEdit = (character: Character) => {
    setError('');
    setEditing(character);
    window.requestAnimationFrame(scrollEditFormIntoView);
  };

  const handleDelete = async (character: Character) => {
    if (remainingDailyDeletions <= 0) {
      setError('캐릭터 삭제는 하루에 한 번만 할 수 있어요.');
      return;
    }

    if (!window.confirm('이 캐릭터를 삭제할까요?')) return;
    try {
      await deleteCharacter(character.id);
      await loadCharacters();
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message === 'CHARACTER_DELETE_DAILY_LIMIT_REACHED') {
        setRemainingDailyDeletions(0);
        setError('캐릭터 삭제는 하루에 한 번만 할 수 있어요.');
        return;
      }
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
        <div ref={editFormRef}>
          <CharacterForm
            editingCharacter={editing}
            onSaved={() => {
              setEditing(null);
              void loadCharacters();
            }}
          />
        </div>
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
          <span
            className={`rounded-full px-3 py-1 text-sm font-black ${
              remainingDailyDeletions > 0 ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800'
            }`}
          >
            삭제 오늘 {remainingDailyDeletions}/{DAILY_CHARACTER_DELETE_LIMIT_PER_STUDENT}회
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {slots.map((character, index) =>
            character ? (
              <CharacterCard
                key={character.id}
                character={character}
                battleStats={battleStatsByCharacterId.get(character.id)}
                onSetRepresentative={handleSetRepresentative}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleteDisabled={remainingDailyDeletions <= 0}
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
