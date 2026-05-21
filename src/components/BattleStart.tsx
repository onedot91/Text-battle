import { FormEvent, useState } from 'react';
import type { BattleRecordInput, BattleResult, Character, Situation } from '../types';
import { createBattleRecord, generateBattleWithGemini } from '../services/battleService';
import { getRepresentativeCharacter } from '../services/characterService';
import { generateFallbackBattle, pickRandomSituation } from '../utils/battleEngine';
import { validateStudentNumber } from '../utils/validators';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

type BattleStartProps = {
  onResult: (payload: {
    characterA: Character;
    characterB: Character;
    situation: Situation;
    result: BattleResult;
  }) => void;
};

export function BattleStart({ onResult }: BattleStartProps) {
  const [myNumber, setMyNumber] = useState('1');
  const [opponentNumber, setOpponentNumber] = useState('2');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const validationError = validateStudentNumber(myNumber) || validateStudentNumber(opponentNumber);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (Number(myNumber) === Number(opponentNumber)) {
      setError('두 번호가 같으면 배틀할 수 없어요.');
      return;
    }

    setIsLoading(true);
    try {
      const [characterA, characterB] = await Promise.all([
        getRepresentativeCharacter(Number(myNumber)),
        getRepresentativeCharacter(Number(opponentNumber)),
      ]);
      if (!characterA || !characterB) {
        setError('대표 캐릭터를 먼저 정해 주세요.');
        return;
      }

      const situation = pickRandomSituation();
      let result: BattleResult;
      try {
        result = await generateBattleWithGemini(characterA, characterB, situation);
      } catch {
        result = generateFallbackBattle(characterA, characterB, situation);
        setNotice('배틀 이야기를 만들지 못해 임시 결과를 보여줍니다.');
      }

      const record: BattleRecordInput = {
        character_a_id: characterA.id,
        character_b_id: characterB.id,
        winner_character_id: result.winnerCharacterId,
        situation_id: situation.id,
        situation_text: situation.text,
        story: result.story,
        reason: result.reason,
        evidence_topic_sentence: result.evidence.topicSentence,
        evidence_support_sentence: result.evidence.supportSentence,
        rewrite_tip: result.rewriteTip,
      };
      try {
        await createBattleRecord(record);
      } catch {
        setNotice('배틀 기록 저장은 실패했지만 결과는 볼 수 있어요.');
      }
      onResult({ characterA, characterB, situation, result });
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="mb-5 text-3xl font-black text-sky-950">배틀 시작하기</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xl font-bold">
            내 번호
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" type="number" min="1" max="99" value={myNumber} onChange={(event) => setMyNumber(event.target.value)} />
          </label>
          <label className="block text-xl font-bold">
            상대 번호
            <input className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl" type="number" min="1" max="99" value={opponentNumber} onChange={(event) => setOpponentNumber(event.target.value)} />
          </label>
        </div>
        <button className="mt-6 w-full rounded-lg bg-rose-600 px-6 py-5 text-2xl font-black text-white hover:bg-rose-700" disabled={isLoading}>
          배틀 시작하기
        </button>
      </form>
      {isLoading && <LoadingMessage message="배틀 이야기를 만드는 중입니다." />}
      {notice && <div className="rounded-lg bg-amber-50 p-5 text-lg font-bold text-amber-900">{notice}</div>}
      <ErrorMessage message={error} />
    </div>
  );
}
