import type { Character, CharacterInput } from '../types';

type CharacterTextSource = Pick<
  Character | CharacterInput,
  'name' | 'ability_blank' | 'support1_blank' | 'support2_blank' | 'support3_blank'
>;

const safeName = (character: Pick<CharacterTextSource, 'name'>) => character.name || '내 캐릭터';

export function getTopicSentence(character: CharacterTextSource) {
  return `내 캐릭터 ${safeName(character)}은/는 ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

export function getSupportSentence1(character: CharacterTextSource) {
  return `${safeName(character)}은/는 ${character.support1_blank} 할 수 있습니다.`;
}

export function getSupportSentence2(character: CharacterTextSource) {
  return `${safeName(character)}은/는 ${character.support2_blank} 때 힘을 발휘합니다.`;
}

export function getSupportSentence3(character: CharacterTextSource) {
  return `${safeName(character)}은/는 그 능력으로 ${character.support3_blank}을/를 도와줍니다.`;
}

export function getFullParagraph(character: CharacterTextSource) {
  return [
    getTopicSentence(character),
    getSupportSentence1(character),
    getSupportSentence2(character),
    getSupportSentence3(character),
  ].join(' ');
}
