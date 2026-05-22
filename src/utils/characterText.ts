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
const getSubject = (character: CharacterTextSource) => `${safeName(character)}${safeSubjectParticle(character)}`;

export function getTopicSentence(character: CharacterTextSource) {
  return `${getSubject(character)} ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

export function getSupportSentence1(character: CharacterTextSource) {
  return `${getSubject(character)} ${character.support1_blank} 수 있습니다.`;
}

export function getSupportSentence2(character: CharacterTextSource) {
  return `${getSubject(character)} ${character.support2_blank} 때 힘을 발휘합니다.`;
}

export function getSupportSentence3(character: CharacterTextSource) {
  return `${safeName(character)}는 그 능력으로 ${character.support3_blank} 도와줍니다.`;
}

export function getFullParagraph(character: CharacterTextSource) {
  return [
    getTopicSentence(character),
    getSupportSentence1(character),
    getSupportSentence2(character),
    getSupportSentence3(character),
  ].join(' ');
}
