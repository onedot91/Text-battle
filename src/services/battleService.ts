import { supabase } from '../lib/supabase';
import type { BattleRecord, BattleRecordInput, BattleResult, Character, Situation } from '../types';
import { generateFallbackBattle } from '../utils/battleEngine';
import { containsUnfairPowerWords } from '../utils/validators';
import { getCharactersByStudentNumber } from './characterService';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const geminiModel = 'gemini-2.5-flash';
const geminiTimeoutMs = 35000;
const shouldUseGeminiProxy = import.meta.env.PROD;
export const DAILY_BATTLE_LIMIT_PER_CHARACTER = 1;

function getLocalDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getTodayBattleCountForCharacter(characterId: string, records: Pick<BattleRecord, 'character_a_id' | 'created_at'>[]) {
  const { startIso, endIso } = getLocalDayRange();
  return records.filter((record) =>
    record.created_at >= startIso &&
    record.created_at < endIso &&
    record.character_a_id === characterId,
  ).length;
}

export function getRemainingDailyBattlesForCharacter(
  characterId: string,
  records: Pick<BattleRecord, 'character_a_id' | 'created_at'>[],
) {
  return Math.max(0, DAILY_BATTLE_LIMIT_PER_CHARACTER - getTodayBattleCountForCharacter(characterId, records));
}

function fairField(value: string) {
  return containsUnfairPowerWords(value) ? '구체적인 장점 없음' : value;
}

function fairTopicSentence(character: Character) {
  return `${character.name}${character.subject_particle || '는'} ${fairField(character.ability_blank)} 특징이 있습니다.`;
}

function fairSupportSentences(character: Character) {
  const subject = `${character.name}${character.subject_particle || '는'}`;

  return [
    `${subject} ${fairField(character.support1_blank)} 수 있습니다.`,
    `${subject} ${fairField(character.support2_blank)} 때 힘을 발휘합니다.`,
    `${character.name}는 그 특징으로 ${fairField(character.support3_blank)} 도와줍니다.`,
  ];
}

function buildPrompt(characterA: Character, characterB: Character, situation: Situation, winner: Character) {
  return `
초3이 읽을 짧은 배틀 이야기만 반환해라. JSON, 마크다운, 제목은 쓰지 마라.

story 규칙:
- 5~6문장, 쉬운 말, 대사 없음. story는 750자 이내.
- 반드시 완성된 문장으로 끝내고 마지막 글자는 마침표로 끝낸다.
- 첫 문장은 "시작되자/준비했습니다"로 쓰지 말고 바로 장면 안으로 들어간다.
- 문학적인 표현을 사용하되 초3이 이해할 수 있게 쓴다.
- 현장감 있는 소리, 표정, 빛, 움직임, 숨소리, 작은 실수 중 2개 이상을 자연스럽게 넣는다.
- 쉬운 비유를 1개 넣는다. 예: 바람처럼, 물결처럼, 종이배처럼. 단, 너무 과장하지 않는다.
- 문장 길이를 모두 비슷하게 쓰지 말고 짧은 문장과 조금 긴 문장을 섞어 리듬을 만든다.
- "했습니다"가 반복되지 않게 "흘렀습니다", "스쳤습니다", "번졌습니다", "가라앉았습니다" 같은 서술어를 섞는다.
- 두 캐릭터가 모두 한 번씩 잘하는 모습을 보인다.
- 입력 문장을 그대로 복사하지 말고 행동으로 보여 준다.
- 작은 위기나 반전을 한 번 넣고, 한 가지 이유로 승부를 낸다.
- 상황에 없는 물건/마법/특별 규칙, 공격/죽음/다침/놀림은 쓰지 않는다.
- story 금지어: 중심문장, 뒷받침문장, 능력 설명, 문장 근거, 문단.
- 피할 표현: 나란히 준비했습니다, 눈 깜짝할 사이, 마지막 고비, 간발의 차이, 분위기를 가져갔다, 흐름을 잡았다.
- 아래에 적힌 "사용 가능한 특징"만 이야기 소재로 쓴다.

승패 규칙:
- 승자는 ${winner.name}이다. 마지막 문장에서 ${winner.name}이 이겼다고 자연스럽게 마무리한다.
- 승자의 입력과 상황이 연결되어야 한다.
- "구체적인 장점 없음"은 특별한 힘으로 쓰지 않는다.

상황:
${situation.text}

characterA:
id: ${characterA.id}
name: ${characterA.name}
사용 가능한 특징: ${fairTopicSentence(characterA)}
사용 가능한 행동: ${fairSupportSentences(characterA).join(' / ')}

characterB:
id: ${characterB.id}
name: ${characterB.name}
사용 가능한 특징: ${fairTopicSentence(characterB)}
사용 가능한 행동: ${fairSupportSentences(characterB).join(' / ')}

이야기 본문만 반환해라.
`;
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

function isCompleteStory(story: string, winnerName: string) {
  const trimmed = story.trim();
  if (!trimmed || !trimmed.includes(winnerName)) return false;
  if (!/[.!?。！？]$/.test(trimmed)) return false;

  const sentenceCount = trimmed
    .split(/[.!?。！？]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;

  return sentenceCount >= 3;
}

export async function generateBattleWithGemini(characterA: Character, characterB: Character, situation: Situation) {
  if (!shouldUseGeminiProxy && (!geminiApiKey || geminiApiKey === 'your-gemini-api-key')) {
    throw new Error('Gemini API key is missing.');
  }

  const plannedResult = generateFallbackBattle(characterA, characterB, situation);
  const winnerCharacter = plannedResult.winner === 'A' ? characterA : characterB;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), geminiTimeoutMs);

  const requestBody = {
    contents: [{ parts: [{ text: buildPrompt(characterA, characterB, situation, winnerCharacter) }] }],
    generationConfig: {
      temperature: 0.86,
      topP: 0.92,
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
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini response was empty.');
  const story = cleanStoryForChildren(text.trim());
  const shouldUseFallback =
    candidate?.finishReason === 'MAX_TOKENS' ||
    containsUnfairPowerWords(story) ||
    !isCompleteStory(story, winnerCharacter.name);

  return {
    story: shouldUseFallback ? plannedResult.story : story,
    winner: plannedResult.winner,
    winnerCharacterId: winnerCharacter.id,
    winnerName: winnerCharacter.name,
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

type BattleRecordQueryOptions = {
  includeStory?: boolean;
  limit?: number;
};

const BATTLE_RECORD_SUMMARY_COLUMNS =
  'id,character_a_id,character_b_id,winner_character_id,situation_id,created_at' as const;

const BATTLE_RECORD_DETAIL_COLUMNS =
  'id,character_a_id,character_b_id,winner_character_id,situation_id,created_at,story' as const;

type BattleRecordQueryResult = Pick<
  BattleRecord,
  'id' | 'character_a_id' | 'character_b_id' | 'winner_character_id' | 'situation_id' | 'created_at'
> &
  Partial<Pick<BattleRecord, 'story'>>;

export type TeacherBattleRecord = BattleRecordQueryResult & {
  characterA?: Character;
  characterB?: Character;
  winnerCharacter?: Character;
};

export async function getAllBattleRecords(options: BattleRecordQueryOptions = {}) {
  const { includeStory = false, limit = 50 } = options;
  const { data: records, error } = await supabase
    .from('battle_records')
    .select(includeStory ? BATTLE_RECORD_DETAIL_COLUMNS : BATTLE_RECORD_SUMMARY_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const queriedRecords = (records || []) as unknown as BattleRecordQueryResult[];
  if (queriedRecords.length === 0) return [] satisfies TeacherBattleRecord[];

  const involvedCharacterIds = Array.from(
    new Set(queriedRecords.flatMap((record) => [record.character_a_id, record.character_b_id, record.winner_character_id])),
  );

  const { data: involvedCharacters, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .in('id', involvedCharacterIds);

  if (characterError) throw characterError;

  const characterMap = new Map((involvedCharacters || []).map((character) => [character.id, character]));

  return queriedRecords.map((record) => ({
    ...record,
    characterA: characterMap.get(record.character_a_id),
    characterB: characterMap.get(record.character_b_id),
    winnerCharacter: characterMap.get(record.winner_character_id),
  })) satisfies TeacherBattleRecord[];
}

export type StudentBattleRecord = BattleRecordQueryResult & {
  characterA?: Character;
  characterB?: Character;
  winnerCharacter?: Character;
  mySide: 'A' | 'B';
};

export async function getBattleRecordsForStudentNumber(
  studentNumber: number,
  options: BattleRecordQueryOptions = {},
) {
  const { includeStory = false, limit = 50 } = options;
  const myCharacters = await getCharactersByStudentNumber(studentNumber);
  const myCharacterIds = myCharacters.map((character) => character.id);

  if (myCharacterIds.length === 0) {
    return [] satisfies StudentBattleRecord[];
  }

  const idList = myCharacterIds.join(',');
  const { data: records, error } = await supabase
    .from('battle_records')
    .select(includeStory ? BATTLE_RECORD_DETAIL_COLUMNS : BATTLE_RECORD_SUMMARY_COLUMNS)
    .or(`character_a_id.in.(${idList}),character_b_id.in.(${idList})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const queriedRecords = (records || []) as unknown as BattleRecordQueryResult[];
  if (queriedRecords.length === 0) return [] satisfies StudentBattleRecord[];

  const involvedCharacterIds = Array.from(
    new Set(queriedRecords.flatMap((record) => [record.character_a_id, record.character_b_id, record.winner_character_id])),
  );

  const { data: involvedCharacters, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .in('id', involvedCharacterIds);

  if (characterError) throw characterError;

  const characterMap = new Map((involvedCharacters || []).map((character) => [character.id, character]));
  const myCharacterIdSet = new Set(myCharacterIds);

  return queriedRecords.map((record) => ({
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

export async function getTodayBattleCountByCharacterId(characterIds: string[]) {
  if (characterIds.length === 0) return new Map<string, number>();

  const { startIso, endIso } = getLocalDayRange();
  const { data, error } = await supabase
    .from('battle_records')
    .select('character_a_id, created_at')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .in('character_a_id', characterIds);

  if (error) throw error;

  const targetIds = new Set(characterIds);
  const countByCharacterId = new Map(characterIds.map((characterId) => [characterId, 0]));

  (data || []).forEach((record) => {
    if (targetIds.has(record.character_a_id)) {
      countByCharacterId.set(record.character_a_id, (countByCharacterId.get(record.character_a_id) ?? 0) + 1);
    }
  });

  return countByCharacterId;
}

export function getRemainingDailyBattlesFromCount(todayBattleCount: number) {
  return Math.max(0, DAILY_BATTLE_LIMIT_PER_CHARACTER - todayBattleCount);
}
