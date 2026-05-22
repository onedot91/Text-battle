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

function subject(character: Character) {
  return `${character.name}${character.subject_particle || '는'}`;
}

function firstSupport(character: Character) {
  return character.support1_blank.replace(/[.!?。！？]+$/g, '');
}

export function generateFallbackBattle(characterA: Character, characterB: Character, situation: Situation): BattleResult {
  const scoreA = calculateKeywordScore(characterA, situation);
  const scoreB = calculateKeywordScore(characterB, situation);
  const luckA = Math.random() * 0.8;
  const luckB = Math.random() * 0.8;
  const totalA = scoreA + luckA;
  const totalB = scoreB + luckB;
  const leadingCharacter = totalA === totalB ? (Math.random() > 0.5 ? characterA : characterB) : totalA > totalB ? characterA : characterB;
  const trailingCharacter = leadingCharacter.id === characterA.id ? characterB : characterA;
  const scoreGap = Math.abs(scoreA - scoreB);
  const shouldReverse = scoreGap <= 1 && Math.random() < 0.28;
  const winner = shouldReverse ? trailingCharacter : leadingCharacter;
  const loser = winner.id === characterA.id ? characterB : characterA;
  const winnerLabel = winner.id === characterA.id ? 'A' : 'B';
  const winnerScore = winner.id === characterA.id ? scoreA : scoreB;
  const loserScore = loser.id === characterA.id ? scoreA : scoreB;
  const isUpset = shouldReverse || winnerScore < loserScore;
  const closeResult = Math.abs(totalA - totalB) < 0.8;
  const resultTurn = isUpset
    ? '마지막 순간, 모두가 숨을 멈출 만큼 뜻밖의 기회가 생겼습니다.'
    : closeResult
      ? '끝까지 차이가 거의 나지 않아 결과를 알 수 없었습니다.'
      : '딱 그때, 상황에 더 잘 맞는 방법이 분명해졌습니다.';

  return {
    story: `${situation.title}이 시작되자 ${characterA.name}과 ${characterB.name}이 나란히 준비했습니다. ${subject(characterA)} ${characterA.ability_blank} 모습으로 먼저 앞서 나갔지만, ${subject(characterB)} ${characterB.ability_blank} 모습으로 눈 깜짝할 사이에 따라붙었습니다. ${resultTurn} ${subject(winner)} ${firstSupport(winner)} 점을 살려 마지막 고비를 아슬아슬하게 넘겼습니다. ${loser.name}도 끝까지 잘 버텼지만, ${winner.name}이 간발의 차이로 이겼습니다.`,
    winner: winnerLabel,
    winnerCharacterId: winner.id,
    winnerName: winner.name,
    usedFallback: true,
  };
}
