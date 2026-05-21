import { FormEvent, useState } from 'react';
import type { Character } from '../types';
import { deleteCharacter, getCharactersByStudentNumber, setRepresentativeCharacter } from '../services/characterService';
import { validateStudentNumber } from '../utils/validators';
import { CharacterCard } from './CharacterCard';
import { CharacterForm } from './CharacterForm';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

export function CharacterBook() {
  const [studentNumber, setStudentNumber] = useState('1');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadCharacters = async (number = Number(studentNumber)) => {
    setError('');
    setIsLoading(true);
    try {
      setCharacters(await getCharactersByStudentNumber(number));
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateStudentNumber(studentNumber);
    if (validationError) {
      setError(validationError);
      return;
    }
    await loadCharacters();
  };

  const handleSetRepresentative = async (character: Character) => {
    try {
      await setRepresentativeCharacter(character.student_number, character.id);
      await loadCharacters(character.student_number);
    } catch {
      setError('대표 캐릭터를 정하지 못했습니다.');
    }
  };

  const handleDelete = async (character: Character) => {
    if (!window.confirm('이 캐릭터를 삭제할까요?')) return;
    try {
      await deleteCharacter(character.id);
      await loadCharacters(character.student_number);
    } catch {
      setError('캐릭터를 삭제하지 못했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <form className="rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSearch}>
        <h2 className="mb-4 text-3xl font-black text-sky-950">내 캐릭터 도감</h2>
        <label className="block text-xl font-bold">
          학생 번호
          <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl md:w-64" type="number" min="1" max="99" value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} />
        </label>
        <button className="mt-4 rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white hover:bg-sky-800">내 캐릭터 보기</button>
      </form>
      <ErrorMessage message={error} />
      {isLoading && <LoadingMessage message="캐릭터를 불러오는 중입니다." />}
      {editing && (
        <CharacterForm
          editingCharacter={editing}
          onSaved={() => {
            setEditing(null);
            void loadCharacters(editing.student_number);
          }}
        />
      )}
      <div className="space-y-5">
        {!isLoading && characters.length === 0 && <div className="rounded-lg bg-white p-6 text-xl font-bold">아직 등록된 캐릭터가 없어요.</div>}
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} onSetRepresentative={handleSetRepresentative} onEdit={setEditing} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
