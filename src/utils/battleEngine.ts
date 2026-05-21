import { situations } from '../data/situations';
import type { BattleResult, Character, Situation } from '../types';
import { getFullParagraph, getSupportSentence1, getSupportSentence2, getSupportSentence3, getTopicSentence } from './characterText';

export function pickRandomSituation() {
  return situations[Math.floor(Math.random() * situations.length)];
}

export function calculateKeywordScore(character: Character, situation: Situation) {
  const text = getFullParagraph(character).replace(/\s+/g, '').toLowerCase();
  return situation.keywords.reduce((score, keyword) => {
    return text.includes(keyword.replace(/\s+/g, '').toLowerCase()) ? score + 1 : score;
  }, 0);
}

function pickEvidenceSentence(character: Character, situation: Situation) {
  const supports = [
    getSupportSentence1(character),
    getSupportSentence2(character),
    getSupportSentence3(character),
  ];
  const matched = supports.find((sentence) =>
    situation.keywords.some((keyword) => sentence.replace(/\s+/g, '').includes(keyword.replace(/\s+/g, ''))),
  );
  return matched || supports[0];
}

export function generateFallbackBattle(characterA: Character, characterB: Character, situation: Situation): BattleResult {
  const scoreA = calculateKeywordScore(characterA, situation);
  const scoreB = calculateKeywordScore(characterB, situation);
  const winner = scoreA === scoreB ? (Math.random() > 0.5 ? characterA : characterB) : scoreA > scoreB ? characterA : characterB;
  const winnerLabel = winner.id === characterA.id ? 'A' : 'B';

  return {
    story: `두 캐릭터가 상황을 해결하기 위해 나섰습니다. ${characterA.name}은/는 자신이 할 수 있는 일을 떠올렸고, ${characterB.name}도 친구들을 돕기 위해 방법을 생각했습니다. 이번 상황에서는 ${winner.name}의 능력이 더 잘 어울렸습니다. ${winner.name}의 문장에는 이 상황을 해결할 수 있는 능력이 더 분명하게 드러났습니다.`,
    winner: winnerLabel,
    winnerCharacterId: winner.id,
    winnerName: winner.name,
    reason: `${winner.name}의 중심문장과 뒷받침문장이 상황 카드와 더 잘 연결되어 있었기 때문입니다.`,
    evidence: {
      topicSentence: getTopicSentence(winner),
      supportSentence: pickEvidenceSentence(winner, situation),
    },
    rewriteTip: '내 캐릭터가 어떤 상황에서 누구를 어떻게 도와주는지 더 자세히 써 보세요.',
    usedFallback: true,
  };
}
