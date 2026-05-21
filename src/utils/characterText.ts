import type { Character, CharacterInput } from '../types';

type CharacterTextSource = Pick<
  Character | CharacterInput,
  'name' | 'ability_blank' | 'support1_blank' | 'support2_blank' | 'support3_blank'
> &
  Partial<
    Pick<
      Character | CharacterInput,
      'subject_particle'
    >
>;

const safeName = (character: Pick<CharacterTextSource, 'name'>) => character.name || '캐릭터';
const safeSubjectParticle = (character: Pick<CharacterTextSource, 'subject_particle'>) =>
  character.subject_particle || '는';

export function getTopicSentence(character: CharacterTextSource) {
  return `캐릭터 ${safeName(character)}${safeSubjectParticle(character)} ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

export function getSupportSentence1(character: CharacterTextSource) {
  return `할 수 있는 일은 ${character.support1_blank}입니다.`;
}

export function getSupportSentence2(character: CharacterTextSource) {
  return `필요한 상황은 ${character.support2_blank}입니다.`;
}

export function getSupportSentence3(character: CharacterTextSource) {
  return `도움 대상이나 일은 ${character.support3_blank}입니다.`;
}

export function getFullParagraph(character: CharacterTextSource) {
  return [
    getTopicSentence(character),
    getSupportSentence1(character),
    getSupportSentence2(character),
    getSupportSentence3(character),
  ].join(' ');
}
