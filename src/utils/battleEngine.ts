import { situations } from '../data/situations';
import type { BattleResult, Character, Situation } from '../types';
import { getFullParagraph } from './characterText';
import { containsUnfairPowerWords } from './validators';

export function pickRandomSituation() {
  return situations[Math.floor(Math.random() * situations.length)];
}

const directWinPhrases = [
  '무조건이김',
  '무조건이긴',
  '무조건승리',
  '항상이김',
  '항상이긴',
  '항상승리',
  '절대안짐',
  '절대지지않',
  '이길수밖에',
  '승리확정',
  '필승',
  '무패',
  '전능',
  '무적',
  '최강',
  '상대가못',
  '상대를못',
  '상대는못',
  '상대방이못',
  '상대방을못',
  '다이김',
  '전부이김',
  '모두이김',
];

const overbroadPowerPhrases = [
  '모든상황',
  '어떤상황',
  '언제나',
  '항상',
  '무조건',
  '전부',
  '모두',
  '다',
];

const genericScoringWords = [
  '빠르게',
  '정확',
  '집중',
  '승부',
  '게임',
  '운',
  '많이',
  '오래',
  '찾기',
  '고르기',
  '맞히기',
  '도착',
  '완성',
  '성공',
  '이기기',
];

function normalizeForScoring(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function removeAll(value: string, words: string[]) {
  return words.reduce((text, word) => text.replaceAll(normalizeForScoring(word), ''), value);
}

function getScorableText(character: Character) {
  const text = normalizeForScoring(getFullParagraph(character));
  if (containsUnfairPowerWords(text)) return '';

  const hasOverbroadPower = overbroadPowerPhrases.some((phrase) => text.includes(normalizeForScoring(phrase)));
  const withoutDirectWins = removeAll(text, directWinPhrases);

  if (!hasOverbroadPower) return withoutDirectWins;
  return removeAll(withoutDirectWins, genericScoringWords);
}

export function calculateKeywordScore(character: Character, situation: Situation) {
  const text = getScorableText(character);
  return situation.keywords.reduce((score, keyword) => {
    return text.includes(normalizeForScoring(keyword)) ? score + 1 : score;
  }, 0);
}

function subject(character: Character) {
  return `${character.name}${character.subject_particle || '는'}`;
}

function firstSupport(character: Character) {
  return character.support1_blank.replace(/[.!?。！？]+$/g, '');
}

function fairStoryAbility(character: Character) {
  return containsUnfairPowerWords(character.ability_blank) ? '침착하게 살피는' : character.ability_blank;
}

function fairStorySupport(character: Character) {
  const support = firstSupport(character);
  return containsUnfairPowerWords(support) ? '차분히 움직인' : support;
}

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
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
    ? pickOne([
        '그때 작은 실수가 오히려 새 길을 열었습니다.',
        '모두가 놓친 빈틈이 딱 하나 보였습니다.',
        '잠깐 멈춘 사이 승부의 방향이 바뀌었습니다.',
      ])
    : closeResult
      ? pickOne([
          '둘의 차이는 종이 한 장만큼이나 작았습니다.',
          '누가 앞서는지 보던 친구들도 고개를 갸웃했습니다.',
          '결과가 보일 듯 말 듯 계속 흔들렸습니다.',
        ])
      : pickOne([
          '그 순간 상황에 꼭 맞는 움직임이 또렷하게 보였습니다.',
          '조용하던 분위기가 한 번에 바뀌었습니다.',
          '작은 선택 하나가 승부를 밀어 주었습니다.',
        ]);
  const opening = pickOne([
    `${situation.title} 차례가 오자 ${characterA.name}과 ${characterB.name}의 어깨가 살짝 올라갔습니다.`,
    `${situation.title} 앞에서 ${characterA.name}과 ${characterB.name}은 서로 다른 표정으로 첫발을 내디뎠습니다.`,
    `친구들이 숨을 죽인 가운데 ${characterA.name}과 ${characterB.name}의 ${situation.title}이 벌어졌습니다.`,
  ]);
  const firstMove = pickOne([
    `${subject(characterA)} ${fairStoryAbility(characterA)} 태도로 흐름을 잡았고, ${subject(characterB)} ${fairStoryAbility(characterB)} 움직임으로 바로 따라붙었습니다.`,
    `${subject(characterA)} ${fairStorySupport(characterA)} 점을 살려 먼저 분위기를 가져갔지만, ${subject(characterB)} ${fairStorySupport(characterB)} 모습으로 금방 균형을 맞췄습니다.`,
  ]);
  const smallMoment = pickOne([
    '친구들은 작은 소리에도 눈을 크게 뜨며 결과를 기다렸습니다.',
    '잠깐 흔들리는 순간이 있었지만 둘 다 쉽게 물러서지 않았습니다.',
    '손끝에 힘이 들어가자 주변이 조용해졌습니다.',
  ]);

  return {
    story: `${opening} ${firstMove} ${smallMoment} ${resultTurn} ${subject(winner)} ${fairStorySupport(winner)} 점을 살려 흔들리던 흐름을 붙잡았고, ${loser.name}도 끝까지 버텼지만 ${winner.name}이 이겼습니다.`,
    winner: winnerLabel,
    winnerCharacterId: winner.id,
    winnerName: winner.name,
    usedFallback: true,
  };
}
