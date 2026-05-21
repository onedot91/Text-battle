import { FormEvent, useState } from 'react';
import type { Character, CharacterInput } from '../types';
import { createCharacter, updateCharacter } from '../services/characterService';
import { validateBlankText, validateCharacterName, validateStudentNumber } from '../utils/validators';
import { ErrorMessage } from './ErrorMessage';

type CharacterFormProps = {
  initialStudentNumber?: number;
  editingCharacter?: Character | null;
  onSaved?: () => void;
};

type EditableCharacterField = Exclude<keyof CharacterInput, 'student_number'>;

const emptyForm: CharacterInput = {
  student_number: 1,
  name: '',
  ability_blank: '',
  support1_blank: '',
  support2_blank: '',
  support3_blank: '',
};

const blankClass =
  'mx-1 my-1 inline-block w-[clamp(10rem,22vw,19rem)] rounded-md border-0 border-b-4 border-slate-300 bg-slate-50 px-3 py-2 align-baseline text-2xl font-bold text-sky-950 focus:border-sky-600';

const nameBlankClass =
  'mx-1 my-1 inline-block w-[clamp(8rem,14vw,13rem)] rounded-md border-0 border-b-4 border-sky-300 bg-sky-50 px-3 py-2 align-baseline text-2xl font-bold text-sky-950 focus:border-sky-600';

const namePreviewClass =
  'mx-1 inline-block min-w-20 border-b-4 border-sky-200 px-2 text-center font-bold text-sky-950';

export function CharacterForm({ initialStudentNumber = 1, editingCharacter, onSaved }: CharacterFormProps) {
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
      : { ...emptyForm, student_number: initialStudentNumber },
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const setField = (field: EditableCharacterField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
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
        setMessage('수정되었어요.');
      } else {
        const result = await createCharacter(form);
        setMessage(result.becameRepresentative ? '등록되었어요. 대표 캐릭터예요.' : '등록되었어요.');
        setForm({ ...emptyForm, student_number: initialStudentNumber });
      }
      onSaved?.();
    } catch {
      setError('저장하지 못했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const namePreview = form.name;

  return (
    <div className="mx-auto max-w-6xl">
      <form className="rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="mb-6 text-3xl font-black text-sky-950">
          {editingCharacter ? '캐릭터 수정하기' : '캐릭터 등록하기'}
        </h2>

        <section className="rounded-lg border-2 border-slate-100 bg-white p-6">
          <p className="text-2xl leading-[4.2rem] tracking-normal">
            내 캐릭터
            <input
              aria-label="캐릭터 이름"
              className={nameBlankClass}
              maxLength={12}
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
            />
            은/는
            <input
              className={blankClass}
              maxLength={40}
              value={form.ability_blank}
              onChange={(event) => setField('ability_blank', event.target.value)}
            />
            능력을 가진 캐릭터입니다.
            <span className="mx-2 inline-block h-2 w-2 rounded-full bg-slate-300 align-middle" />
            <span className={namePreviewClass}>{namePreview}</span>
            은/는
            <input
              className={blankClass}
              maxLength={40}
              value={form.support1_blank}
              onChange={(event) => setField('support1_blank', event.target.value)}
            />
            할 수 있습니다.
            <span className="mx-2 inline-block h-2 w-2 rounded-full bg-slate-300 align-middle" />
            이 능력은
            <input
              className={blankClass}
              maxLength={40}
              value={form.support2_blank}
              onChange={(event) => setField('support2_blank', event.target.value)}
            />
            때 필요합니다.
            <span className="mx-2 inline-block h-2 w-2 rounded-full bg-slate-300 align-middle" />
            <span className={namePreviewClass}>{namePreview}</span>
            은/는 이 능력으로
            <input
              className={blankClass}
              maxLength={40}
              value={form.support3_blank}
              onChange={(event) => setField('support3_blank', event.target.value)}
            />
            을/를 도와줍니다.
          </p>
        </section>

        <div className="mt-6 space-y-4">
          <button
            className="w-full rounded-lg bg-sky-700 px-6 py-4 text-2xl font-black text-white hover:bg-sky-800"
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
          {message && <div className="rounded-lg bg-emerald-50 p-4 text-lg font-bold text-emerald-800">{message}</div>}
          <ErrorMessage message={error} />
        </div>
      </form>
    </div>
  );
}
