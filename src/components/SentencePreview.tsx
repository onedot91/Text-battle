import type { Character, CharacterInput } from '../types';
import {
  getFullParagraph,
  getSupportSentence1,
  getSupportSentence2,
  getSupportSentence3,
  getTopicSentence,
} from '../utils/characterText';

type PreviewCharacter = Pick<
  Character | CharacterInput,
  'name' | 'ability_blank' | 'support1_blank' | 'support2_blank' | 'support3_blank'
>;

export function SentencePreview({ character }: { character: PreviewCharacter }) {
  return (
    <section className="rounded-lg border-2 border-emerald-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-2xl font-black text-emerald-900">실시간 문장 미리보기</h3>
      <div className="space-y-4 text-lg leading-8">
        <p><strong>중심문장:</strong> {getTopicSentence(character)}</p>
        <p><strong>뒷받침문장 1:</strong> {getSupportSentence1(character)}</p>
        <p><strong>뒷받침문장 2:</strong> {getSupportSentence2(character)}</p>
        <p><strong>뒷받침문장 3:</strong> {getSupportSentence3(character)}</p>
      </div>
      <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-lg leading-8">
        <strong>완성 문단</strong>
        <p className="mt-2">{getFullParagraph(character)}</p>
      </div>
    </section>
  );
}
