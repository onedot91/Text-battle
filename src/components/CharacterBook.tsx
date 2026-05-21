import { useCallback, useEffect, useState } from 'react';
import type { Character } from '../types';
import { deleteCharacter, getCharactersByStudentNumber, setRepresentativeCharacter } from '../services/characterService';
import { CharacterCard } from './CharacterCard';
import { CharacterForm } from './CharacterForm';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

type CharacterBookProps = {
  initialStudentNumber?: number;
};

export function CharacterBook({ initialStudentNumber = 1 }: CharacterBookProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadCharacters = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      setCharacters(await getCharactersByStudentNumber(initialStudentNumber));
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [initialStudentNumber]);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

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
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-3xl font-black text-sky-950">내 캐릭터</h2>
        <button
          className="rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white hover:bg-sky-800"
          onClick={() => void loadCharacters()}
        >
          내 캐릭터 보기
        </button>
      </section>
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
      <div className="space-y-5">
        {!isLoading && characters.length === 0 && <div className="rounded-lg bg-white p-6 text-xl font-bold">없어요.</div>}
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onSetRepresentative={handleSetRepresentative}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
