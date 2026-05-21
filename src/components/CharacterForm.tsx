import { FormEvent, useState } from 'react';
import type { Character, CharacterInput } from '../types';
import { createCharacter, updateCharacter } from '../services/characterService';
import { validateBlankText, validateCharacterName, validateStudentNumber } from '../utils/validators';
import { ErrorMessage } from './ErrorMessage';

type CharacterFormProps = {
  initialStudentNumber?: number;
  editingCharacter?: Character | null;
  showTitle?: boolean;
  onSaved?: () => void;
};

type EditableCharacterField = Exclude<keyof CharacterInput, 'student_number'>;

const emptyForm: CharacterInput = {
  student_number: 1,
  name: '',
  subject_particle: '는',
  ability_blank: '',
  support1_blank: '',
  support2_blank: '',
  support3_blank: '',
};

const blankClass =
  'mx-1 my-1 inline-block min-h-14 w-[clamp(10rem,22vw,19rem)] rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2 text-center align-baseline text-2xl font-bold text-sky-950 shadow-[inset_0_-3px_0_rgba(148,163,184,0.35)] transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]';

const supportBlankClass =
  'min-h-14 min-w-0 max-w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2 align-baseline text-2xl font-bold text-sky-950 shadow-[inset_0_-3px_0_rgba(148,163,184,0.35)] transition focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]';

const supportLineClass = 'mt-3 flex items-center gap-2';

const sentencePeriodClass = 'text-3xl font-bold text-sky-950';

const nameBlankClass =
  'min-h-14 w-[clamp(8rem,14vw,13rem)] border-0 bg-slate-50 px-4 py-2 text-center align-baseline text-2xl font-bold text-sky-950 placeholder:text-slate-400 focus:outline-none';

const particleSelectClass =
  'min-h-14 border-0 bg-slate-50 px-3 py-2 align-baseline text-2xl font-black text-sky-950 focus:outline-none';

const nameParticleGroupClass =
  'mx-1 my-1 inline-flex overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-50 align-baseline shadow-[inset_0_-3px_0_rgba(148,163,184,0.35)] transition focus-within:border-sky-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]';

const sentenceCardClass =
  'rounded-lg border-2 border-slate-100 bg-white p-5 shadow-sm';

const sentenceClass = 'mt-3 text-2xl leading-[4.2rem] tracking-normal';

const topicTagClass =
  'inline-flex rounded-full bg-sky-700 px-4 py-1 text-base font-black text-white';

const supportTagClass =
  'inline-flex rounded-full bg-emerald-100 px-4 py-1 text-base font-black text-emerald-800';

const getSupportBlankStyle = (value: string) => ({
  width: `clamp(10rem, ${Math.max(10, value.length + 2)}ch, 100%)`,
});

export function CharacterForm({ initialStudentNumber = 1, editingCharacter, showTitle = true, onSaved }: CharacterFormProps) {
  const [form, setForm] = useState<CharacterInput>(
    editingCharacter
      ? {
          student_number: editingCharacter.student_number,
          name: editingCharacter.name,
          subject_particle: editingCharacter.subject_particle || '는',
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

  return (
    <div className="mx-auto max-w-6xl">
      <form className="rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        {showTitle && (
          <h2 className="mb-6 text-3xl font-black text-sky-950">
            {editingCharacter ? '캐릭터 수정하기' : '캐릭터 등록하기'}
          </h2>
        )}

        <section className="space-y-4" aria-label="캐릭터 문장 입력">
          <article className={sentenceCardClass}>
            <span className={topicTagClass}>중심문장</span>
            <p className={sentenceClass}>
              <span className={nameParticleGroupClass}>
                <input
                  aria-label="캐릭터 이름"
                  className={nameBlankClass}
                  maxLength={12}
                  placeholder="캐릭터 이름"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                />
                <select
                  aria-label="이름 뒤 조사"
                  className={particleSelectClass}
                  value={form.subject_particle}
                  onChange={(event) => setField('subject_particle', event.target.value as CharacterInput['subject_particle'])}
                >
                  <option value="은">은</option>
                  <option value="는">는</option>
                </select>
              </span>
              <input
                aria-label="캐릭터 중심 능력"
                className={blankClass}
                maxLength={40}
                placeholder="능력 설명"
                value={form.ability_blank}
                onChange={(event) => setField('ability_blank', event.target.value)}
              />
              능력을 가진 캐릭터입니다.
            </p>
          </article>

          <article className={sentenceCardClass}>
            <span className={supportTagClass}>뒷받침문장</span>
            <p className={supportLineClass}>
              <input
                aria-label="첫 번째 뒷받침 내용"
                className={supportBlankClass}
                maxLength={40}
                style={getSupportBlankStyle(form.support1_blank)}
                value={form.support1_blank}
                onChange={(event) => setField('support1_blank', event.target.value)}
              />
              <span className={sentencePeriodClass}>.</span>
            </p>
          </article>

          <article className={sentenceCardClass}>
            <span className={supportTagClass}>뒷받침문장</span>
            <p className={supportLineClass}>
              <input
                aria-label="두 번째 뒷받침 내용"
                className={supportBlankClass}
                maxLength={40}
                style={getSupportBlankStyle(form.support2_blank)}
                value={form.support2_blank}
                onChange={(event) => setField('support2_blank', event.target.value)}
              />
              <span className={sentencePeriodClass}>.</span>
            </p>
          </article>

          <article className={sentenceCardClass}>
            <span className={supportTagClass}>뒷받침문장</span>
            <p className={supportLineClass}>
              <input
                aria-label="세 번째 뒷받침 내용"
                className={supportBlankClass}
                maxLength={40}
                style={getSupportBlankStyle(form.support3_blank)}
                value={form.support3_blank}
                onChange={(event) => setField('support3_blank', event.target.value)}
              />
              <span className={sentencePeriodClass}>.</span>
            </p>
          </article>
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
