import { useState } from 'react';
import type { BattleResult as BattleResultType, Character, CharacterFieldName, Situation } from '../types';
import { updateCharacter } from '../services/characterService';
import { createRewriteLog } from '../services/rewriteService';
import {
  getFullParagraph,
  getSupportSentence1,
  getSupportSentence2,
  getSupportSentence3,
  getTopicSentence,
} from '../utils/characterText';
import { validateBlankText } from '../utils/validators';
import { ErrorMessage } from './ErrorMessage';

type BattleResultProps = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

const fieldLabels: Record<CharacterFieldName, string> = {
  ability_blank: '중심문장',
  support1_blank: '뒷받침문장 1',
  support2_blank: '뒷받침문장 2',
  support3_blank: '뒷받침문장 3',
};

function sentenceForField(character: Character, field: CharacterFieldName) {
  if (field === 'ability_blank') return getTopicSentence(character);
  if (field === 'support1_blank') return getSupportSentence1(character);
  if (field === 'support2_blank') return getSupportSentence2(character);
  return getSupportSentence3(character);
}

export function BattleResult({ characterA, characterB, situation, result }: BattleResultProps) {
  const [myCharacter, setMyCharacter] = useState(characterA);
  const [field, setField] = useState<CharacterFieldName>('ability_blank');
  const [newValue, setNewValue] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRewrite = async () => {
    setError('');
    setMessage('');
    const validationError = validateBlankText(newValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const beforeText = myCharacter[field];
      const updated = await updateCharacter(myCharacter.id, { [field]: newValue.trim() });
      await createRewriteLog({
        character_id: myCharacter.id,
        student_number: myCharacter.student_number,
        field_name: field,
        before_text: beforeText,
        after_text: newValue.trim(),
      });
      setMyCharacter(updated);
      setNewValue('');
      setMessage('문장을 고쳤습니다.');
    } catch {
      setError('문장을 고치지 못했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black text-sky-950">{characterA.name} VS {characterB.name}</h2>
        {result.usedFallback && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-lg font-bold text-amber-900">배틀 이야기를 만들지 못해 임시 결과를 보여줍니다.</p>}
      </section>
      <section className="rounded-lg border-2 border-sky-100 bg-white p-6">
        <h3 className="text-2xl font-black text-sky-900">상황 카드</h3>
        <p className="mt-3 text-xl leading-8">{situation.text}</p>
      </section>
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900">배틀 이야기</h3>
        <p className="mt-3 text-xl leading-9">{result.story}</p>
      </section>
      <section className="rounded-lg border-4 border-yellow-200 bg-yellow-50 p-6">
        <h3 className="text-2xl font-black text-yellow-950">승리 캐릭터</h3>
        <p className="mt-3 text-3xl font-black text-yellow-900">{result.winnerName}</p>
        <p className="mt-4 text-xl leading-8"><strong>승리 이유:</strong> {result.reason}</p>
      </section>
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-emerald-900">근거가 된 문장</h3>
        <p className="mt-3 text-xl leading-8"><strong>중심문장:</strong> {result.evidence.topicSentence}</p>
        <p className="mt-2 text-xl leading-8"><strong>뒷받침문장:</strong> {result.evidence.supportSentence}</p>
      </section>
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-sky-950">고쳐쓰기 질문</h3>
        <p className="mt-3 text-xl leading-8">내 캐릭터의 능력이 더 잘 드러나려면 어떤 문장을 고치면 좋을까요?</p>
        <p className="mt-3 rounded-lg bg-sky-50 p-4 text-lg font-bold text-sky-900">배틀 결과를 보고 내 캐릭터의 능력이 더 잘 드러나도록 문장을 고쳐 봅시다.</p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4 text-lg leading-8">
          <strong>내 캐릭터의 현재 문장</strong>
          <p className="mt-2">{getFullParagraph(myCharacter)}</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[240px_1fr]">
          <label className="block text-xl font-bold">
            고쳐 쓸 문장 선택
            <select className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" value={field} onChange={(event) => setField(event.target.value as CharacterFieldName)}>
              {Object.entries(fieldLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xl font-bold">
            새 빈칸 내용 입력
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" maxLength={40} value={newValue} onChange={(event) => setNewValue(event.target.value)} />
          </label>
        </div>
        <p className="mt-4 text-lg leading-8"><strong>선택한 현재 문장:</strong> {sentenceForField(myCharacter, field)}</p>
        <button className="mt-5 rounded-lg bg-emerald-700 px-6 py-4 text-xl font-black text-white hover:bg-emerald-800" onClick={handleRewrite}>
          문장 고치기
        </button>
        {message && <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-lg font-bold text-emerald-800">{message}</div>}
        <div className="mt-4"><ErrorMessage message={error} /></div>
      </section>
    </div>
  );
}
