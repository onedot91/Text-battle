import { supabase } from '../lib/supabase';
import type { BattleRecord, BattleRecordInput, BattleResult, Character, Situation } from '../types';
import { getCharactersByStudentNumber } from './characterService';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const geminiModel = 'gemini-2.5-flash';
const geminiTimeoutMs = 35000;
const shouldUseGeminiProxy = import.meta.env.PROD;

function topicSentence(character: Character) {
  return `${character.name}${character.subject_particle || '는'} ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

function supportSentences(character: Character) {
  const subject = `${character.name}${character.subject_particle || '는'}`;

  return [
    `${subject} ${character.support1_blank} 수 있습니다.`,
    `${subject} ${character.support2_blank} 때 힘을 발휘합니다.`,
    `${character.name}는 그 능력으로 ${character.support3_blank} 도와줍니다.`,
  ];
}

function buildPrompt(characterA: Character, characterB: Character, situation: Situation) {
  return `
너는 초등학교 3학년 국어 수업을 돕는 배틀 이야기 생성기다.

목표:
- 학생이 입력한 중심문장과 뒷받침문장을 바탕으로 짧고 재미있는 한 편의 배틀 이야기를 만든다.
- story에는 수업 용어를 쓰지 않는다. 금지어: 중심문장, 뒷받침문장, 능력 설명, 문장 근거, 문단.
- 입력 문장을 그대로 복사하지 말고 행동으로 바꾸어 보여 준다.

이야기 구조:
1문장: ${situation.title}이 시작되는 장면을 구체적으로 연다.
2문장: characterA가 자기 특징을 살려 먼저 시도한다.
3문장: characterB가 다른 방식으로 따라붙는다.
4문장: 승부가 갈릴 작은 문제가 생기고, 승리 캐릭터가 자기 특징에 맞게 해결한다.
5문장: 누가 왜 이겼는지 자연스럽게 마무리한다.

재미 장치:
- story 안에 딱 한 번, 아슬아슬한 반전이나 작은 위기를 넣는다.
- 가끔은 처음에 밀리던 캐릭터가 마지막에 역전해도 좋다.
- 예: 거의 질 뻔함, 마지막 1초, 손에서 미끄러짐, 모두가 숨을 멈춤, 간발의 차이.
- 감탄을 살리는 짧은 표현은 허용한다. 예: 아슬아슬하게, 간신히, 눈 깜짝할 사이에, 딱 그때.
- 단, 상황에 없는 물건이나 마법 같은 사건은 만들지 않는다.

작성 규칙:
- story는 반드시 4~5문장으로 쓴다.
- 한 문장은 너무 길게 쓰지 않는다.
- 대사는 쓰지 않는다. 감탄 표현은 서술문 안에서만 쓴다.
- 상황에 없는 물건이나 사건을 갑자기 만들지 않는다. 예: 동전, 카드, 마법, 심판의 특별 지시.
- 캐릭터의 특징은 설명하지 말고 행동으로 보여 준다.
- 두 캐릭터 모두 한 번씩 잘하는 모습을 보여 준다.
- 승부는 한 가지 분명한 이유로 갈린다.
- 공격, 죽음, 다침, 놀림은 쓰지 않는다.
- 초등학교 3학년이 이해할 수 있는 쉬운 말로 쓴다.

판정 규칙:
승리 캐릭터는 characterA 또는 characterB 중 하나여야 한다.
- 상황과 더 직접적으로 맞는 행동을 한 캐릭터가 이긴다.
- 승패가 비슷하면 마지막 문제를 더 잘 처리한 캐릭터가 이긴다.
- 역전승은 허용하지만, 승리 캐릭터의 입력 문장과 상황이 연결되어야 한다.

결과는 JSON으로만 반환한다. 마크다운을 사용하지 않는다.

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
  "winnerName": "승리 캐릭터의 이름"
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

function cleanStoryForChildren(story: string) {
  return story
    .replace(/['"]?중심문장['"]?/g, '생각')
    .replace(/['"]?뒷받침문장['"]?/g, '자세한 말')
    .replace(/문장처럼/g, '말처럼')
    .replace(/능력으로/g, '힘으로')
    .replace(/능력은/g, '힘은')
    .replace(/설명을 듣고/g, '이야기를 듣고');
}

export async function generateBattleWithGemini(characterA: Character, characterB: Character, situation: Situation) {
  if (!shouldUseGeminiProxy && (!geminiApiKey || geminiApiKey === 'your-gemini-api-key')) {
    throw new Error('Gemini API key is missing.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), geminiTimeoutMs);

  const requestBody = {
    contents: [{ parts: [{ text: buildPrompt(characterA, characterB, situation) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.78,
      topP: 0.9,
    },
  };

  const response = await fetch(
    shouldUseGeminiProxy
      ? '/api/gemini'
      : `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    },
  ).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI 응답이 늦어서 기본 이야기로 만들었어요.');
    }
    throw error;
  }).finally(() => window.clearTimeout(timeoutId));

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText) as { error?: { message?: string } | string };
      errorMessage =
        typeof parsed.error === 'string'
          ? parsed.error
          : parsed.error?.message || errorText;
    } catch {
      // Keep the original text when the API did not return JSON.
    }

    throw new Error(`Gemini request failed: ${response.status}${errorMessage ? ` ${errorMessage}` : ''}`);
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
    story: cleanStoryForChildren(textOrFallback(parsed.story, '')),
    winner,
    winnerCharacterId: textOrFallback(parsed.winnerCharacterId, winnerCharacter.id),
    winnerName: textOrFallback(parsed.winnerName, winnerCharacter.name),
  } satisfies BattleResult;
}

export async function createBattleRecord(record: BattleRecordInput) {
  const { data, error } = await supabase.from('battle_records').insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function getRecentBattleRecords(limit = 10) {
  const { data, error } = await supabase
    .from('battle_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data satisfies BattleRecord[];
}

export type TeacherBattleRecord = BattleRecord & {
  characterA?: Character;
  characterB?: Character;
  winnerCharacter?: Character;
};

export async function getAllBattleRecords() {
  const { data: records, error } = await supabase
    .from('battle_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!records || records.length === 0) return [] satisfies TeacherBattleRecord[];

  const involvedCharacterIds = Array.from(
    new Set(records.flatMap((record) => [record.character_a_id, record.character_b_id, record.winner_character_id])),
  );

  const { data: involvedCharacters, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .in('id', involvedCharacterIds);

  if (characterError) throw characterError;

  const characterMap = new Map((involvedCharacters || []).map((character) => [character.id, character]));

  return records.map((record) => ({
    ...record,
    characterA: characterMap.get(record.character_a_id),
    characterB: characterMap.get(record.character_b_id),
    winnerCharacter: characterMap.get(record.winner_character_id),
  })) satisfies TeacherBattleRecord[];
}

export type StudentBattleRecord = BattleRecord & {
  characterA?: Character;
  characterB?: Character;
  winnerCharacter?: Character;
  mySide: 'A' | 'B';
};

export async function getBattleRecordsForStudentNumber(studentNumber: number) {
  const myCharacters = await getCharactersByStudentNumber(studentNumber);
  const myCharacterIds = myCharacters.map((character) => character.id);

  if (myCharacterIds.length === 0) {
    return [] satisfies StudentBattleRecord[];
  }

  const idList = myCharacterIds.join(',');
  const { data: records, error } = await supabase
    .from('battle_records')
    .select('*')
    .or(`character_a_id.in.(${idList}),character_b_id.in.(${idList})`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!records || records.length === 0) return [] satisfies StudentBattleRecord[];

  const involvedCharacterIds = Array.from(
    new Set(records.flatMap((record) => [record.character_a_id, record.character_b_id, record.winner_character_id])),
  );

  const { data: involvedCharacters, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .in('id', involvedCharacterIds);

  if (characterError) throw characterError;

  const characterMap = new Map((involvedCharacters || []).map((character) => [character.id, character]));
  const myCharacterIdSet = new Set(myCharacterIds);

  return records.map((record) => ({
    ...record,
    characterA: characterMap.get(record.character_a_id),
    characterB: characterMap.get(record.character_b_id),
    winnerCharacter: characterMap.get(record.winner_character_id),
    mySide: myCharacterIdSet.has(record.character_a_id) ? 'A' : 'B',
  })) satisfies StudentBattleRecord[];
}

export async function getIncomingBattleRecordCountForStudentNumber(studentNumber: number) {
  const myCharacters = await getCharactersByStudentNumber(studentNumber);
  const myCharacterIds = myCharacters.map((character) => character.id);

  if (myCharacterIds.length === 0) return 0;

  const { count, error } = await supabase
    .from('battle_records')
    .select('id', { count: 'exact', head: true })
    .in('character_b_id', myCharacterIds);

  if (error) throw error;
  return count ?? 0;
}
