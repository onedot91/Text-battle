type Character = {
  id: string;
  name: string;
  ability_blank: string;
  support1_blank: string;
  support2_blank: string;
  support3_blank: string;
};

type Situation = {
  id: string;
  text: string;
  keywords: string[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function topicSentence(character: Character) {
  return `내 캐릭터 ${character.name}은/는 ${character.ability_blank} 능력을 가진 캐릭터입니다.`;
}

function supportSentences(character: Character) {
  return [
    `${character.name}은/는 ${character.support1_blank} 할 수 있습니다.`,
    `${character.name}은/는 ${character.support2_blank} 때 힘을 발휘합니다.`,
    `${character.name}은/는 그 능력으로 ${character.support3_blank}을/를 도와줍니다.`,
  ];
}

function buildPrompt(characterA: Character, characterB: Character, situation: Situation) {
  return `
너는 초등학교 3학년 국어 수업을 돕는 배틀 이야기 생성기다.
목표는 학생들이 중심문장과 뒷받침문장의 관계를 이해하도록 돕는 것이다.
강한 캐릭터가 아니라 상황을 더 잘 해결하는 캐릭터가 이긴다.
승리 이유는 반드시 중심문장과 뒷받침문장을 근거로 설명한다.
폭력, 공격, 죽음, 다치게 하는 표현은 사용하지 않는다.
캐릭터가 서로 때리거나 다치게 하지 않는다.
초등학교 3학년이 이해할 수 있는 쉬운 문장으로 쓴다.
결과는 반드시 JSON으로만 반환한다.
마크다운을 사용하지 않는다.
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
  "winnerCharacterId": "승리 캐릭터 id",
  "winnerName": "승리 캐릭터 이름",
  "reason": "승리 이유",
  "evidence": {
    "topicSentence": "근거가 된 중심문장",
    "supportSentence": "근거가 된 뒷받침문장"
  },
  "rewriteTip": "고쳐쓰기 조언"
}
`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY 환경변수가 없습니다.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { characterA, characterB, situation } = (await req.json()) as {
      characterA: Character;
      characterB: Character;
      situation: Situation;
    };

    if (!characterA || !characterB || !situation) {
      return new Response(JSON.stringify({ error: 'characterA, characterB, situation이 필요합니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: 'Gemini 호출에 실패했습니다.', detail: errorText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: 'Gemini 응답이 비어 있습니다.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(text);
    const winnerCharacter = parsed.winner === 'A' ? characterA : characterB;
    const normalized = {
      story: parsed.story,
      winner: parsed.winner === 'B' ? 'B' : 'A',
      winnerCharacterId: parsed.winnerCharacterId || winnerCharacter.id,
      winnerName: parsed.winnerName || winnerCharacter.name,
      reason: parsed.reason,
      evidence: parsed.evidence,
      rewriteTip: parsed.rewriteTip,
    };

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: '배틀 이야기를 만들지 못했습니다.',
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
