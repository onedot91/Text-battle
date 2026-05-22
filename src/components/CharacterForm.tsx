import { FormEvent, useState } from 'react';
import type { Character, CharacterInput } from '../types';
import { createCharacter, updateCharacter } from '../services/characterService';
import { validateBlankText, validateCharacterName, validateStudentNumber } from '../utils/validators';
import { ErrorMessage } from './ErrorMessage';

type CharacterFormProps = {
  initialStudentNumber?: number;
  editingCharacter?: Character | null;
  showTitle?: boolean;
  onHome?: () => void;
  onChooseNext?: (nextView: 'book' | 'battle') => void;
  onSaved?: () => void;
};

type EditableCharacterField = Exclude<keyof CharacterInput, 'student_number'>;
const CHARACTER_NAME_MAX_LENGTH = 7;
const ABILITY_MAX_LENGTH = 20;
const SUPPORT_ACTION_MAX_LENGTH = 30;
const SUPPORT_SITUATION_MAX_LENGTH = 30;
const SUPPORT_TARGET_MAX_LENGTH = 25;

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
  'col-start-1 row-start-1 min-h-14 w-full min-w-0 rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2 align-baseline text-2xl font-bold text-sky-950 shadow-[inset_0_-3px_0_rgba(148,163,184,0.35)] transition focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]';

const supportLineClass = 'mt-3 flex flex-wrap items-center gap-2';

const supportSubjectClass =
  'shrink-0 py-3 text-2xl font-black text-slate-950';

const supportFixedTextClass = 'py-3 text-2xl font-bold text-slate-950';

const supportInputSizerClass =
  'col-start-1 row-start-1 invisible min-h-14 min-w-40 max-w-full whitespace-pre rounded-lg border-2 px-4 py-2 text-2xl font-bold';

const supportInputWrapClass = 'inline-grid max-w-full min-w-0';

const nameBlankClass =
  'min-h-14 border-0 bg-slate-50 px-4 py-2 text-left align-baseline text-2xl font-bold text-sky-950 placeholder:text-slate-400 focus:outline-none';

const particleSelectClass =
  'particle-select min-h-14 border-0 border-l-2 border-slate-200 bg-slate-50 px-3 py-2 align-baseline text-2xl font-black text-sky-950 focus:outline-none';

const nameParticleGroupClass =
  'mx-1 my-1 inline-flex overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-50 align-baseline shadow-[inset_0_-3px_0_rgba(148,163,184,0.35)] transition focus-within:border-sky-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]';

const sentenceCardClass =
  'rounded-lg border-2 border-slate-100 bg-white p-5 shadow-sm';

const supportSentenceCardClass =
  'ml-8 rounded-lg border-2 border-slate-100 border-l-8 border-l-emerald-100 bg-white p-5 shadow-sm';

const sentenceClass = 'mt-3 flex flex-wrap items-center gap-2 text-2xl leading-[4.2rem] tracking-normal';

const sentenceFixedTextClass = 'font-bold text-sky-950';

const topicTagClass =
  'inline-flex rounded-full bg-sky-700 px-4 py-1 text-base font-black text-white';

const supportTagClass =
  'inline-flex rounded-full bg-emerald-100 px-4 py-1 text-base font-black text-emerald-800';

const getTextWidth = (value: string, fallbackLength: number) => {
  const length = Math.max(fallbackLength, value.length || fallbackLength);
  return `${length * 1.55 + 4.5}rem`;
};

const getBlankStyle = (value: string, fallbackLength: number, minRem: number, maxRem: number) => ({
  width: `min(100%, clamp(${minRem}rem, ${getTextWidth(value, fallbackLength)}, ${maxRem}rem))`,
});

export function CharacterForm({
  initialStudentNumber = 1,
  editingCharacter,
  showTitle = true,
  onHome,
  onChooseNext,
  onSaved,
}: CharacterFormProps) {
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
  const [fieldWarning, setFieldWarning] = useState('');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isNextChoiceOpen, setIsNextChoiceOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supportSubject = `${form.name || '캐릭터'}${form.subject_particle}`;

  const showFieldWarning = (warning: string) => {
    setFieldWarning(warning);
    setIsWarningModalOpen(true);
  };

  const setField = (field: EditableCharacterField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const setCharacterName = (value: string) => {
    if (value.length > CHARACTER_NAME_MAX_LENGTH) {
      showFieldWarning('캐릭터 이름은 7글자까지 쓸 수 있어요.');
      setField('name', value.slice(0, CHARACTER_NAME_MAX_LENGTH));
      return;
    }
    setField('name', value);
  };

  const setLimitedField = (field: EditableCharacterField, value: string, maxLength: number, label: string) => {
    if (value.length > maxLength) {
      showFieldWarning(`${label}은 ${maxLength}자까지 쓸 수 있어요.`);
      setField(field, value.slice(0, maxLength));
      return;
    }
    setField(field, value);
  };

  const validate = () => {
    const errors = [
      validateStudentNumber(form.student_number),
      validateCharacterName(form.name),
      validateBlankText(form.ability_blank, ABILITY_MAX_LENGTH, '능력 설명'),
      validateBlankText(form.support1_blank, SUPPORT_ACTION_MAX_LENGTH, '할 수 있는 일'),
      validateBlankText(form.support2_blank, SUPPORT_SITUATION_MAX_LENGTH, '힘을 발휘하는 때'),
      validateBlankText(form.support3_blank, SUPPORT_TARGET_MAX_LENGTH, '도움 대상'),
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
        onSaved?.();
      } else {
        const result = await createCharacter(form);
        setMessage(result.becameRepresentative ? '등록되었어요. 대표 캐릭터예요.' : '등록되었어요.');
        setForm({ ...emptyForm, student_number: initialStudentNumber });
        if (onChooseNext) {
          setIsNextChoiceOpen(true);
        } else {
          onSaved?.();
        }
      }
    } catch (saveError) {
      const detail = saveError instanceof Error ? ` ${saveError.message}` : '';
      setError(`저장하지 못했어요.${detail}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {onHome && (
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-sm font-black text-slate-500">{initialStudentNumber}번</p>
            <h1 className="text-3xl font-black text-slate-950">
              {editingCharacter ? '캐릭터 수정하기' : '캐릭터 등록하기'}
            </h1>
          </div>
          <button
            className="rounded-lg bg-slate-950 px-5 py-3 text-lg font-black text-white transition hover:bg-slate-800"
            type="button"
            onClick={onHome}
          >
            홈으로 가기
          </button>
        </header>
      )}

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
              <span
                className={nameParticleGroupClass}
                style={getBlankStyle(form.name, 8.5, 12.5, 23)}
              >
                <input
                  aria-label="캐릭터 이름"
                  className={`${nameBlankClass} min-w-0 flex-1`}
                  maxLength={CHARACTER_NAME_MAX_LENGTH + 1}
                  placeholder="캐릭터 이름"
                  value={form.name}
                  onChange={(event) => setCharacterName(event.target.value)}
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
                maxLength={ABILITY_MAX_LENGTH + 1}
                placeholder="능력 설명"
                style={getBlankStyle(form.ability_blank, 8, 12, 64)}
                value={form.ability_blank}
                onChange={(event) => setLimitedField('ability_blank', event.target.value, ABILITY_MAX_LENGTH, '능력 설명')}
              />
              <span className={sentenceFixedTextClass}>능력을 가진 캐릭터입니다.</span>
            </p>
          </article>

          <article className={supportSentenceCardClass}>
            <span className={supportTagClass}>뒷받침문장</span>
            <p className={supportLineClass}>
              <span className={supportSubjectClass}>{supportSubject}</span>
              <span className={supportInputWrapClass}>
                <span className={supportInputSizerClass} aria-hidden="true">
                  {form.support1_blank || ' '}
                </span>
                <input
                  aria-label="첫 번째 뒷받침 내용"
                  className={supportBlankClass}
                  maxLength={SUPPORT_ACTION_MAX_LENGTH + 1}
                  value={form.support1_blank}
                  onChange={(event) => setLimitedField('support1_blank', event.target.value, SUPPORT_ACTION_MAX_LENGTH, '할 수 있는 일')}
                />
              </span>
              <span className={supportFixedTextClass}>수 있습니다.</span>
            </p>
          </article>

          <article className={supportSentenceCardClass}>
            <span className={supportTagClass}>뒷받침문장</span>
            <p className={supportLineClass}>
              <span className={supportSubjectClass}>{supportSubject}</span>
              <span className={supportInputWrapClass}>
                <span className={supportInputSizerClass} aria-hidden="true">
                  {form.support2_blank || ' '}
                </span>
                <input
                  aria-label="두 번째 뒷받침 내용"
                  className={supportBlankClass}
                  maxLength={SUPPORT_SITUATION_MAX_LENGTH + 1}
                  value={form.support2_blank}
                  onChange={(event) => setLimitedField('support2_blank', event.target.value, SUPPORT_SITUATION_MAX_LENGTH, '힘을 발휘하는 때')}
                />
              </span>
              <span className={supportFixedTextClass}>때 힘을 발휘합니다.</span>
            </p>
          </article>

          <article className={supportSentenceCardClass}>
            <span className={supportTagClass}>뒷받침문장</span>
            <p className={supportLineClass}>
              <span className={supportSubjectClass}>{form.name || '캐릭터'}는 그 능력으로</span>
              <span className={supportInputWrapClass}>
                <span className={supportInputSizerClass} aria-hidden="true">
                  {form.support3_blank || ' '}
                </span>
                <input
                  aria-label="세 번째 뒷받침 내용"
                  className={supportBlankClass}
                  maxLength={SUPPORT_TARGET_MAX_LENGTH + 1}
                  value={form.support3_blank}
                  onChange={(event) => setLimitedField('support3_blank', event.target.value, SUPPORT_TARGET_MAX_LENGTH, '도움 대상')}
                />
              </span>
              <span className={supportFixedTextClass}>도와줍니다.</span>
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
      {isWarningModalOpen && fieldWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-6">
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="field-warning-title"
          >
            <h3 id="field-warning-title" className="text-2xl font-black text-sky-950">
              글자 수를 줄여 주세요
            </h3>
            <p className="mt-4 text-xl font-bold leading-8 text-slate-800">{fieldWarning}</p>
            <button
              className="mt-6 w-full rounded-lg bg-sky-700 px-5 py-4 text-xl font-black text-white hover:bg-sky-800"
              type="button"
              onClick={() => setIsWarningModalOpen(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
      {isNextChoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-6">
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="next-choice-title"
          >
            <h3 id="next-choice-title" className="text-2xl font-black text-sky-950">
              다음에 무엇을 할까요?
            </h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-lg bg-emerald-700 px-5 py-5 text-xl font-black text-white hover:bg-emerald-800"
                type="button"
                onClick={() => {
                  setIsNextChoiceOpen(false);
                  onChooseNext?.('book');
                }}
              >
                내 캐릭터 보기
              </button>
              <button
                className="rounded-lg bg-rose-600 px-5 py-5 text-xl font-black text-white hover:bg-rose-700"
                type="button"
                onClick={() => {
                  setIsNextChoiceOpen(false);
                  onChooseNext?.('battle');
                }}
              >
                배틀하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
