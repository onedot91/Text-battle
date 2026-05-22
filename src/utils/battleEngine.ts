import { situations } from '../data/situations';
import type { BattleResult, Character, Situation } from '../types';
import { getFullParagraph } from './characterText';

export function pickRandomSituation() {
  return situations[Math.floor(Math.random() * situations.length)];
}

export function calculateKeywordScore(character: Character, situation: Situation) {
  const text = getFullParagraph(character).replace(/\s+/g, '').toLowerCase();
  return situation.keywords.reduce((score, keyword) => {
    return text.includes(keyword.replace(/\s+/g, '').toLowerCase()) ? score + 1 : score;
  }, 0);
}

export function generateFallbackBattle(characterA: Character, characterB: Character, situation: Situation): BattleResult {
  const scoreA = calculateKeywordScore(characterA, situation);
  const scoreB = calculateKeywordScore(characterB, situation);
  const luckA = Math.random() * 0.8;
  const luckB = Math.random() * 0.8;
  const totalA = scoreA + luckA;
  const totalB = scoreB + luckB;
  const winner = totalA === totalB ? (Math.random() > 0.5 ? characterA : characterB) : totalA > totalB ? characterA : characterB;
  const loser = winner.id === characterA.id ? characterB : characterA;
  const winnerLabel = winner.id === characterA.id ? 'A' : 'B';
  const winnerScore = winner.id === characterA.id ? scoreA : scoreB;
  const loserScore = loser.id === characterA.id ? scoreA : scoreB;
  const isUpset = winnerScore < loserScore;
  const closeResult = Math.abs(totalA - totalB) < 0.8;
  const resultTurn = isUpset
    ? '그때 마침 상황이 조금 바뀌면서 예상과 다르게 작은 이변이 일어났습니다.'
    : closeResult
      ? '두 방법이 모두 좋아서 결과는 마지막 순간까지 쉽게 정해지지 않았습니다.'
      : '두 방법 모두 도움이 되었지만 상황에 조금 더 잘 맞는 쪽이 있었습니다.';

  return {
    story: `${situation.text} ${characterA.name}은/는 먼저 친구들이 덜 걱정하도록 자신이 잘하는 일을 해 보았습니다. ${characterB.name}도 가만히 있지 않고 친구들에게 필요한 도움을 찾아 나섰습니다. 처음에는 ${characterA.name}의 방법이 친구들의 눈길을 끌었습니다. 곧이어 ${characterB.name}도 차분히 움직이며 상황을 조금씩 좋게 만들었습니다. ${loser.name}의 방법도 친구들에게 분명히 도움이 되었고, ${winner.name}의 방법도 마지막까지 힘을 냈습니다. ${resultTurn} 두 캐릭터는 끝까지 거의 비슷하게 상황을 해결해 나갔습니다. 마지막에는 ${winner.name}의 방법이 한 걸음 더 먼저 맞아떨어져서 가까스로 승리했습니다.`,
    winner: winnerLabel,
    winnerCharacterId: winner.id,
    winnerName: winner.name,
    usedFallback: true,
  };
}
