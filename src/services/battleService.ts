import {
  addDoc,
  collection,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BattleRecord, BattleRecordInput, BattleResult, Character, Situation } from '../types';

const battleRecordsCollection = collection(db, 'battle_records');
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const geminiModel = 'gemini-2.5-flash';

function timestampToString(value: Timestamp | string | null | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function toBattleRecord(snapshot: QueryDocumentSnapshot<DocumentData>): BattleRecord {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    character_a_id: String(data.character_a_id || ''),
    character_b_id: String(data.character_b_id || ''),
    winner_character_id: String(data.winner_character_id || ''),
    situation_id: String(data.situation_id || ''),
    situation_text: String(data.situation_text || ''),
    story: String(data.story || ''),
    reason: String(data.reason || ''),
    evidence_topic_sentence: data.evidence_topic_sentence ? String(data.evidence_topic_sentence) : null,
    evidence_support_sentence: data.evidence_support_sentence ? String(data.evidence_support_sentence) : null,
    rewrite_tip: data.rewrite_tip ? String(data.rewrite_tip) : null,
    created_at: timestampToString(data.created_at),
  };
}

function topicSentence(character: Character) {
  return `내 캐릭터 ${character.name}은/는 ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

function supportSentences(character: Character) {
  return [
    `${character.name}은/는 ${character.support1_blank} 할 수 있습니다.`,
    `이 능력은 ${character.support2_blank} 때 필요합니다.`,
    `${character.name}은/는 이 능력으로 ${character.support3_blank}을/를 도와줍니다.`,
  ];
}

function buildPrompt(characterA: Character, characterB: Character, situation: Situation) {
  return `
너는 초등학교 3학년 국어 수업을 돕는 배틀 이야기 생성기다.
목표는 학생들이 중심문장과 뒷받침문장의 관계를 이해하도록 돕는 것이다.
강한 캐릭터가 아니라 주어진 상황을 더 잘 해결하는 캐릭터가 이긴다.
승리 이유는 반드시 중심문장과 뒷받침문장을 근거로 설명한다.
공격, 죽음, 상처를 주는 표현은 사용하지 않는다.
캐릭터가 서로 놀리거나 다치게 하지 않는다.
초등학교 3학년이 이해할 수 있는 쉬운 문장으로 쓴다.
결과는 JSON으로만 반환한다. 마크다운을 사용하지 않는다.
승리 캐릭터는 characterA 또는 characterB 중 하나여야 한다.
승패가 애매하면 상황과 더 직접적으로 연결되는 문장이 있는 캐릭터를 선택한다.
배틀 이야기는 4~6문장 정도로 작성한다.
고쳐쓰기 조언은 비난하지 않고 부드럽게 작성한다.

상황:
${situation.text}

characterA:
id: ${characterA.id}
name: ${characterA.name}
중심문장: ${topicSentence(characterA)}
뒷받침문장: ${supportSentences(characterA).join(' / ')}

characterB:
id: ${characterB.id}
name: ${characterB.name}
중심문장: ${topicSentence(characterB)}
뒷받침문장: ${supportSentences(characterB).join(' / ')}

다음 JSON 형식만 반환해라.
{
  "story": "배틀 이야기",
  "winner": "A 또는 B",
  "winnerCharacterId": "승리 캐릭터의 id",
  "winnerName": "승리 캐릭터의 이름",
  "reason": "승리 이유",
  "evidence": {
    "topicSentence": "근거가 된 중심문장",
    "supportSentence": "근거가 된 뒷받침문장"
  },
  "rewriteTip": "고쳐쓰기 조언"
}
`;
}

function parseGeminiJson(text: string) {
  const normalized = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  return JSON.parse(normalized) as Partial<BattleResult>;
}

function textOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export async function generateBattleWithGemini(characterA: Character, characterB: Character, situation: Situation) {
  if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key') {
    throw new Error('Gemini API key is missing.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(characterA, characterB, situation) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini response was empty.');

  const parsed = parseGeminiJson(text);
  const winner = parsed.winner === 'B' ? 'B' : 'A';
  const winnerCharacter = winner === 'A' ? characterA : characterB;

  return {
    story: textOrFallback(parsed.story, ''),
    winner,
    winnerCharacterId: textOrFallback(parsed.winnerCharacterId, winnerCharacter.id),
    winnerName: textOrFallback(parsed.winnerName, winnerCharacter.name),
    reason: textOrFallback(parsed.reason, ''),
    evidence: {
      topicSentence: textOrFallback(parsed.evidence?.topicSentence, topicSentence(winnerCharacter)),
      supportSentence: textOrFallback(parsed.evidence?.supportSentence, supportSentences(winnerCharacter)[0]),
    },
    rewriteTip: textOrFallback(parsed.rewriteTip, ''),
  } satisfies BattleResult;
}

export async function createBattleRecord(record: BattleRecordInput) {
  const reference = await addDoc(battleRecordsCollection, {
    ...record,
    created_at: serverTimestamp(),
  });
  return {
    id: reference.id,
    ...record,
    created_at: new Date().toISOString(),
  };
}

export async function getRecentBattleRecords(limit = 10) {
  const snapshot = await getDocs(
    query(battleRecordsCollection, orderBy('created_at', 'desc'), firestoreLimit(limit)),
  );
  return snapshot.docs.map(toBattleRecord);
}
