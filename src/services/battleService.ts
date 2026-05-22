import { supabase } from '../lib/supabase';
import type { BattleRecord, BattleRecordInput, BattleResult, Character, Situation } from '../types';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const geminiModel = 'gemini-2.5-flash';
const geminiTimeoutMs = 35000;
const shouldUseGeminiProxy = import.meta.env.PROD;

function topicSentence(character: Character) {
  return `캐릭터 ${character.name}${character.subject_particle || '는'} ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

function supportSentences(character: Character) {
  return [
    `할 수 있는 일은 ${character.support1_blank}입니다.`,
    `필요한 상황은 ${character.support2_blank}입니다.`,
    `도움 대상이나 일은 ${character.support3_blank}입니다.`,
  ];
}

function buildPrompt(characterA: Character, characterB: Character, situation: Situation) {
  return `
너는 초등학교 3학년 국어 수업을 돕는 배틀 이야기 생성기다.
목표는 학생들이 중심문장과 뒷받침문장의 관계를 이해하도록 돕는 것이다.
강한 캐릭터가 아니라 주어진 상황을 더 잘 해결하는 캐릭터가 이긴다.
승리 이유는 내부적으로 중심문장과 뒷받침문장을 근거로 판단한다.
story에는 중심문장, 뒷받침문장, 능력 설명, 문장 근거 같은 수업 용어를 절대 쓰지 않는다.
story에는 characterA와 characterB의 특징, 할 수 있는 일, 도와주는 방식이 행동과 장면으로 자연스럽게 드러나야 한다.
캐릭터가 자신의 능력을 따옴표 안에서 그대로 말하거나 설명하게 하지 않는다.
story에는 따옴표 대사를 되도록 쓰지 말고, 대사가 꼭 필요하면 짧고 자연스러운 생활 말투로만 쓴다.
입력 문장을 그대로 복사하지 말고, 초등학교 3학년이 읽는 동화처럼 쉬운 말로 바꾸어 쓴다.
두 캐릭터가 모두 상황 해결에 도움이 되도록 묘사하되, 마지막에는 누가 이겼는지 분명히 드러내라.
한쪽이 압도적으로 지는 내용은 쓰지 않는다. 결과는 작은 차이, 한 걸음 차이, 마지막 순간의 선택처럼 아슬아슬하게 나타나야 한다.
때때로 운, 우연한 기회, 예상 밖의 상황 때문에 이변이 일어날 수 있다. 단, 승리 캐릭터의 문장 근거와 완전히 어긋나면 안 된다.
공격, 죽음, 상처를 주는 표현은 사용하지 않는다.
캐릭터가 서로 놀리거나 다치게 하지 않는다.
초등학교 3학년이 이해할 수 있는 쉬운 문장으로 쓴다.
결과는 JSON으로만 반환한다. 마크다운을 사용하지 않는다.
승리 캐릭터는 characterA 또는 characterB 중 하나여야 한다.
승패가 애매하면 상황과 더 직접적으로 연결되는 문장이 있는 캐릭터를 선택하되, 아주 가까운 승부처럼 표현한다.
배틀 이야기는 5~6문장 정도로 작성한다.
각 캐릭터의 특징이 이야기 속 행동으로 최소 두 번 이상 드러나게 한다.
중간에는 두 캐릭터가 번갈아 장점을 보여 주는 장면을 넣어 여유 있게 전개한다.
story 필드는 해설문이 아니라 이야기처럼 작성한다. 마지막 문장에는 승리 캐릭터 이름과 승리 결과가 자연스럽게 드러나야 한다.
story 필드 금지 표현: "중심문장", "뒷받침문장", "능력으로", "능력은", "설명을 듣고", "문장처럼", 입력 문장을 따옴표로 직접 인용하는 표현.

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
      temperature: 0.9,
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
