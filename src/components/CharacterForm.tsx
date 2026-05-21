import { FormEvent, useState } from 'react';
import type { Character, CharacterInput } from '../types';
import { createCharacter, updateCharacter } from '../services/characterService';
import { validateBlankText, validateCharacterName, validateStudentNumber } from '../utils/validators';
import { SentencePreview } from './SentencePreview';
import { ErrorMessage } from './ErrorMessage';

type CharacterFormProps = {
  editingCharacter?: Character | null;
  onSaved?: () => void;
};

const emptyForm: CharacterInput = {
  student_number: 1,
  name: '',
  ability_blank: '',
  support1_blank: '',
  support2_blank: '',
  support3_blank: '',
};

export function CharacterForm({ editingCharacter, onSaved }: CharacterFormProps) {
  const [form, setForm] = useState<CharacterInput>(
    editingCharacter
      ? {
          student_number: editingCharacter.student_number,
          name: editingCharacter.name,
          ability_blank: editingCharacter.ability_blank,
          support1_blank: editingCharacter.support1_blank,
          support2_blank: editingCharacter.support2_blank,
          support3_blank: editingCharacter.support3_blank,
        }
      : emptyForm,
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const setField = (field: keyof CharacterInput, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'student_number' ? Number(value) : value,
    }));
  };

  const validate = () => {
    const errors = [
      validateStudentNumber(form.student_number),
      validateCharacterName(form.name),
      validateBlankText(form.ability_blank),
      validateBlankText(form.support1_blank),
      validateBlankText(form.support2_blank),
      validateBlankText(form.support3_blank),
    ].filter(Boolean);
    return errors[0] || '';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      if (editingCharacter) {
        await updateCharacter(editingCharacter.id, form);
        setMessage('캐릭터를 수정했습니다.');
      } else {
        const result = await createCharacter(form);
        setMessage(
          result.becameRepresentative
            ? '캐릭터가 등록되었습니다. 대표 캐릭터로 설정되었습니다.'
            : '캐릭터가 등록되었습니다.',
        );
        setForm(emptyForm);
      }
      onSaved?.();
    } catch {
      setError('캐릭터를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form className="rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="mb-5 text-3xl font-black text-sky-950">{editingCharacter ? '캐릭터 수정하기' : '캐릭터 등록하기'}</h2>
        <p className="mb-5 rounded-lg bg-amber-50 p-4 text-lg font-bold text-amber-900">
          능력은 다른 사람을 해치는 능력이 아니라 문제를 해결하거나 누군가를 돕는 능력이어야 해요.
        </p>
        <div className="space-y-5">
          <label className="block text-xl font-bold">
            학생 번호
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" type="number" min="1" max="99" value={form.student_number} disabled={Boolean(editingCharacter)} onChange={(event) => setField('student_number', event.target.value)} />
          </label>
          <label className="block text-xl font-bold">
            캐릭터 이름
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" maxLength={12} value={form.name} onChange={(event) => setField('name', event.target.value)} />
          </label>
          <label className="block text-xl font-bold">
            중심문장 빈칸: 능력
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" maxLength={40} value={form.ability_blank} onChange={(event) => setField('ability_blank', event.target.value)} />
          </label>
          <label className="block text-xl font-bold">
            뒷받침문장 1 빈칸: 할 수 있는 일
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" maxLength={40} value={form.support1_blank} onChange={(event) => setField('support1_blank', event.target.value)} />
          </label>
          <label className="block text-xl font-bold">
            뒷받침문장 2 빈칸: 힘을 발휘하는 때
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" maxLength={40} value={form.support2_blank} onChange={(event) => setField('support2_blank', event.target.value)} />
          </label>
          <label className="block text-xl font-bold">
            뒷받침문장 3 빈칸: 도와주는 대상
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" maxLength={40} value={form.support3_blank} onChange={(event) => setField('support3_blank', event.target.value)} />
          </label>
        </div>
        <div className="mt-6 space-y-4">
          <button className="w-full rounded-lg bg-sky-700 px-6 py-4 text-2xl font-black text-white hover:bg-sky-800" disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
          {message && <div className="rounded-lg bg-emerald-50 p-4 text-lg font-bold text-emerald-800">{message}</div>}
          <ErrorMessage message={error} />
        </div>
      </form>
      <SentencePreview character={form} />
    </div>
  );
}
