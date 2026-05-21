import { FormEvent, useState } from 'react';
import type { BattleRecordInput, BattleResult, Character, Situation } from '../types';
import { createBattleRecord, generateBattleWithGemini } from '../services/battleService';
import { getRepresentativeCharacter } from '../services/characterService';
import { generateFallbackBattle, pickRandomSituation } from '../utils/battleEngine';
import { validateStudentNumber } from '../utils/validators';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

type BattleStartProps = {
  initialStudentNumber?: number;
  onResult: (payload: {
    characterA: Character;
    characterB: Character;
    situation: Situation;
    result: BattleResult;
  }) => void;
};

export function BattleStart({ initialStudentNumber = 1, onResult }: BattleStartProps) {
  const [opponentNumber, setOpponentNumber] = useState(initialStudentNumber === 1 ? '2' : '1');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const myNumber = initialStudentNumber;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const validationError = validateStudentNumber(myNumber) || validateStudentNumber(opponentNumber);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (myNumber === Number(opponentNumber)) {
      setError('같은 번호와는 배틀할 수 없어요.');
      return;
    }

    setIsLoading(true);
    try {
      const [characterA, characterB] = await Promise.all([
        getRepresentativeCharacter(myNumber),
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
        setNotice('임시 결과');
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

      void createBattleRecord(record).catch(() => setNotice('기록 저장 실패'));
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
        <label className="block text-xl font-bold">
          상대 번호
          <input
            className="mt-2 w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-xl"
            type="number"
            min="1"
            max="99"
            value={opponentNumber}
            onChange={(event) => setOpponentNumber(event.target.value)}
          />
        </label>
        <button
          className="mt-6 w-full rounded-lg bg-rose-600 px-6 py-5 text-2xl font-black text-white hover:bg-rose-700"
          disabled={isLoading}
        >
          배틀 시작하기
        </button>
      </form>
      {isLoading && <LoadingMessage message="만드는 중" />}
      {notice && <div className="rounded-lg bg-amber-50 p-5 text-lg font-bold text-amber-900">{notice}</div>}
      <ErrorMessage message={error} />
    </div>
  );
}
