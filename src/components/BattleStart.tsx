import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BattleRecordInput, BattleResult, Character, Situation } from '../types';
import {
  DAILY_BATTLE_LIMIT_PER_CHARACTER,
  createBattleRecord,
  generateBattleWithGemini,
  getRemainingDailyBattlesFromCount,
  getTodayBattleCountByCharacterId,
} from '../services/battleService';
import { getRandomBattleOpponentCandidates, getRepresentativeCharacter } from '../services/characterService';
import { generateFallbackBattle, pickRandomSituation } from '../utils/battleEngine';
import { situations } from '../data/situations';
import { validateStudentNumber } from '../utils/validators';
import {
  playErrorSound,
  playRouletteLockSound,
  playRouletteTickSound,
  playStoryTransitionSound,
} from '../utils/soundEffects';
import { ErrorMessage } from './ErrorMessage';

const activeBattleRequests = new Set<number>();
const opponentRouletteDurationMs = 3200;
const situationRouletteDurationMs = 3600;
const rouletteTickMs = 90;
const storyLoadingMessages = [
  '캐릭터 행동을 고르는 중',
  '아슬아슬한 장면을 넣는 중',
  '승부가 갈리는 순간을 만드는 중',
  '마지막 문장을 다듬는 중',
  '두 캐릭터를 경기장에 세우는 중',
  '멋진 첫 장면을 준비하는 중',
  '긴장되는 대결 흐름을 짜는 중',
  '이기는 이유를 살펴보는 중',
  '반짝이는 표현을 찾는 중',
  '응원 소리를 더하는 중',
  '결정적인 장면을 고르는 중',
  '이야기를 재미있게 섞는 중',
  '승리 장면을 확인하는 중',
  '마무리 표현을 고르는 중',
];

type LoadingStep = 'opponent' | 'situation' | 'story';

type BattleStartProps = {
  initialStudentNumber?: number;
  onResult: (payload: {
    characterA: Character;
    characterB: Character;
    situation: Situation;
    result: BattleResult;
  }) => void;
  onUnavailable?: (message: string) => void;
};

type RoulettePanelProps = {
  title: string;
  badge?: string;
  value: string;
  items: string[];
  isSpinning: boolean;
  showSelection?: boolean;
  singleChoice?: boolean;
  tone: 'sky' | 'rose' | 'emerald';
};

const toneClasses = {
  sky: {
    box: 'roulette-tone-sky',
    label: 'text-sky-800',
    active: 'is-active',
  },
  rose: {
    box: 'roulette-tone-rose',
    label: 'text-rose-800',
    active: 'is-active',
  },
  emerald: {
    box: 'roulette-tone-emerald',
    label: 'text-emerald-800',
    active: 'is-active',
  },
};

type RoulettePanelStyle = CSSProperties & {
  '--reel-choice-count'?: number;
  '--reel-spin-duration'?: string;
  '--reel-spin-y'?: string;
  '--roulette-settle-y'?: string;
};

const reelStepPx = 48;
const reelCenterOffsetPx = 78;

function getReelItems(items: string[], value: string, isSpinning: boolean) {
  const fallbackItems = items.length > 0 ? items : [value || '준비 중'];
  const centerValue = value || fallbackItems[0] || '준비 중';
  const selectedIndex = Math.max(0, fallbackItems.indexOf(centerValue));

  if (isSpinning) {
    return {
      items: [...fallbackItems, ...fallbackItems],
      selectedIndex,
      choiceCount: fallbackItems.length,
    };
  }

  const beforeCount = 3;
  const afterCount = 5;
  const settledItems = Array.from({ length: beforeCount + afterCount + 1 }, (_, index) => {
    const offset = index - beforeCount;
    const nextIndex = (selectedIndex + offset + fallbackItems.length) % fallbackItems.length;
    return fallbackItems[nextIndex];
  });

  return {
    items: settledItems,
    selectedIndex: beforeCount,
    choiceCount: fallbackItems.length,
  };
}

function RoulettePanel({
  title,
  badge,
  value,
  items,
  isSpinning,
  showSelection = true,
  singleChoice = false,
  tone,
}: RoulettePanelProps) {
  const classes = toneClasses[tone];
  const reel = getReelItems(items, value, isSpinning);
  const reelStyle: RoulettePanelStyle = {
    '--reel-choice-count': reel.choiceCount,
    '--reel-spin-duration': `${Math.min(8, Math.max(1.8, reel.choiceCount * 0.08))}s`,
    '--reel-spin-y': `${-(reel.choiceCount * reelStepPx) - 3}px`,
    '--roulette-settle-y': `${reelCenterOffsetPx - reel.selectedIndex * reelStepPx}px`,
  };

  return (
    <article className={`battle-roulette-panel overflow-hidden rounded-lg border-2 p-5 ${classes.box}`}>
      <div className="battle-roulette-heading flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-lg font-black ${classes.label}`}>{title}</p>
          {badge && (
            <span className="battle-roulette-badge rounded-full bg-white px-3 py-1 text-base font-black text-slate-800 shadow-sm ring-1 ring-slate-200">
              {badge}
            </span>
          )}
        </div>
        {isSpinning && (
          <span className="battle-roulette-dots flex gap-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-current opacity-40 [animation-delay:-180ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-current opacity-55 [animation-delay:-90ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-current opacity-70" />
          </span>
        )}
      </div>

      <div className="battle-reel-window relative mt-4 h-44 overflow-hidden rounded-lg border border-white/80 bg-white">
        {singleChoice ? (
          <div className="battle-reel-single">
            <div className={`battle-reel-item ${classes.active}`}>
              <span className="truncate">{value}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="battle-reel-fade battle-reel-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 h-12" />
            <div className="battle-reel-fade battle-reel-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12" />
            {(isSpinning || showSelection) && (
              <div className="battle-reel-focus pointer-events-none absolute inset-x-4 top-1/2 z-10 h-14 -translate-y-1/2 rounded-lg border-2 border-slate-900/10" />
            )}
            <div
              className={`slot-reel ${isSpinning ? 'slot-reel-spinning' : 'slot-reel-settled'}`}
              style={reelStyle}
            >
              {reel.items.map((item, index) => (
                <div
                  className={`battle-reel-item mx-4 my-2 flex h-14 items-center rounded-lg border-2 px-4 text-2xl font-black ${
                    index === reel.selectedIndex && !isSpinning && showSelection
                      ? classes.active
                      : ''
                  }`}
                  key={`${item}-${index}`}
                >
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function BattleStart({ initialStudentNumber = 1, onResult, onUnavailable }: BattleStartProps) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('opponent');
  const [myCharacter, setMyCharacter] = useState<Character | null>(null);
  const [opponentName, setOpponentName] = useState('');
  const [opponentNumber, setOpponentNumber] = useState<number | null>(null);
  const [situationTitle, setSituationTitle] = useState('');
  const [opponentReelItems, setOpponentReelItems] = useState<string[]>([]);
  const [storyMessageIndex, setStoryMessageIndex] = useState(0);
  const situationReelItems = situations.map((situation) => situation.title);
  const myNumber = initialStudentNumber;

  const showError = (message: string) => {
    playErrorSound();
    setError(message);
  };

  const showUnavailable = (message: string) => {
    if (onUnavailable) {
      onUnavailable(message);
      return;
    }

    showError(message);
  };

  const pickRandomOpponent = (candidates: Character[]) => {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  };

  const runOpponentRoulette = (candidates: Character[], selectedCharacter: Character) =>
    new Promise<void>((resolve) => {
      setLoadingStep('opponent');
      let index = 0;
      setOpponentReelItems(candidates.map((candidate) => candidate.name));
      setOpponentName(candidates[0]?.name || selectedCharacter.name);
      setOpponentNumber(candidates[0]?.student_number ?? selectedCharacter.student_number);

      const intervalId = window.setInterval(() => {
        const candidate = candidates[index % candidates.length];
        playRouletteTickSound();
        setOpponentName(candidate.name);
        setOpponentNumber(candidate.student_number);
        index += 1;
      }, rouletteTickMs);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        playRouletteLockSound();
        setOpponentName(selectedCharacter.name);
        setOpponentNumber(selectedCharacter.student_number);
        resolve();
      }, opponentRouletteDurationMs);
    });

  const runSituationRoulette = (selectedSituation: Situation) =>
    new Promise<void>((resolve) => {
      setLoadingStep('situation');
      let index = 0;
      setSituationTitle(situations[0]?.title || selectedSituation.title);

      const intervalId = window.setInterval(() => {
        const situation = situations[index % situations.length];
        playRouletteTickSound();
        setSituationTitle(situation.title);
        index += 1;
      }, rouletteTickMs);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        playRouletteLockSound();
        setSituationTitle(selectedSituation.title);
        resolve();
      }, situationRouletteDurationMs);
    });

  const startBattle = async () => {
    if (activeBattleRequests.has(myNumber)) return;

    setError('');
    setNotice('');
    setMyCharacter(null);
    setOpponentName('');
    setOpponentNumber(null);
    setSituationTitle('');
    setOpponentReelItems([]);
    setLoadingStep('opponent');

    const validationError = validateStudentNumber(myNumber);
    if (validationError) {
      showError(validationError);
      return;
    }

    activeBattleRequests.add(myNumber);
    setIsLoading(true);
    try {
      const [characterA, opponentCandidates] = await Promise.all([
        getRepresentativeCharacter(myNumber),
        getRandomBattleOpponentCandidates(myNumber),
      ]);

      if (!characterA) {
        showUnavailable('내 대표 캐릭터를 먼저 정해 주세요.');
        return;
      }

      if (opponentCandidates.length === 0) {
        showUnavailable('배틀할 수 있는 다른 대표 캐릭터가 아직 없어요.');
        return;
      }

      const todayBattleCountByCharacterId = await getTodayBattleCountByCharacterId([
        characterA.id,
      ]);
      const myRemainingBattles = getRemainingDailyBattlesFromCount(
        todayBattleCountByCharacterId.get(characterA.id) ?? 0,
      );

      if (myRemainingBattles <= 0) {
        showUnavailable(`오늘 이 캐릭터의 배틀 횟수 ${DAILY_BATTLE_LIMIT_PER_CHARACTER}회를 모두 사용했습니다.`);
        return;
      }

      setMyCharacter(characterA);
      const characterB = pickRandomOpponent(opponentCandidates);
      const situation = pickRandomSituation();

      await runOpponentRoulette(opponentCandidates, characterB);
      await runSituationRoulette(situation);
      playStoryTransitionSound();
      setLoadingStep('story');

      let result: BattleResult;

      try {
        result = await generateBattleWithGemini(characterA, characterB, situation);
      } catch (geminiError) {
        const message = geminiError instanceof Error ? geminiError.message : '알 수 없는 오류';
        console.error('Gemini battle generation failed.', geminiError);
        result = generateFallbackBattle(characterA, characterB, situation);
        result.fallbackReason = message;
        setNotice(message);
      }

      const record: BattleRecordInput = {
        character_a_id: characterA.id,
        character_b_id: characterB.id,
        winner_character_id: result.winnerCharacterId,
        situation_id: situation.id,
        situation_text: situation.text,
        story: result.story,
        reason: '',
        evidence_topic_sentence: null,
        evidence_support_sentence: null,
        rewrite_tip: null,
      };

      const latestBattleCountByCharacterId = await getTodayBattleCountByCharacterId([characterA.id]);
      const canSaveBattle =
        getRemainingDailyBattlesFromCount(latestBattleCountByCharacterId.get(characterA.id) ?? 0) > 0;

      if (!canSaveBattle) {
        showUnavailable('배틀 횟수가 모두 사용되어 결과를 저장하지 않았습니다. 다른 캐릭터로 다시 시도해 주세요.');
        return;
      }

      await createBattleRecord(record);
      onResult({ characterA, characterB, situation, result });
    } catch (battleError) {
      console.error('Battle failed.', battleError);
      showUnavailable('배틀을 완료하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      activeBattleRequests.delete(myNumber);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void startBattle();
    // startBattle intentionally runs when the battle screen is entered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myNumber]);

  useEffect(() => {
    if (loadingStep !== 'story') {
      setStoryMessageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setStoryMessageIndex((current) => (current + 1) % storyLoadingMessages.length);
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [loadingStep]);

  return (
    <div className="battle-start-screen space-y-6">
      {isLoading && (
        <section className="battle-loading-card overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="battle-loading-header bg-slate-950 px-6 py-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-2xl font-black">
                {loadingStep === 'opponent' && '상대 룰렛'}
                {loadingStep === 'situation' && '상황 룰렛'}
                {loadingStep === 'story' && '배틀 생성'}
              </p>
              <div className="flex gap-2">
                <span className={`h-3 w-12 rounded-full ${loadingStep === 'opponent' ? 'bg-rose-400' : 'bg-white/25'}`} />
                <span className={`h-3 w-12 rounded-full ${loadingStep === 'situation' ? 'bg-emerald-400' : 'bg-white/25'}`} />
                <span className={`h-3 w-12 rounded-full ${loadingStep === 'story' ? 'bg-sky-400' : 'bg-white/25'}`} />
              </div>
            </div>
          </div>

          <div className="battle-roulette-grid grid gap-5 p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <RoulettePanel
              title="내 캐릭터"
              badge={myCharacter ? `${myCharacter.student_number}번` : undefined}
              value={myCharacter?.name || '불러오는 중'}
              items={myCharacter ? [myCharacter.name] : ['불러오는 중']}
              isSpinning={false}
              singleChoice
              tone="sky"
            />
            <RoulettePanel
              title="상대 캐릭터"
              badge={opponentNumber !== null ? `${opponentNumber}번` : undefined}
              value={opponentName || '고르는 중'}
              items={opponentReelItems}
              isSpinning={loadingStep === 'opponent'}
              tone="rose"
            />
          </div>

          {loadingStep !== 'opponent' && (
            <div className="battle-situation-row px-6 pb-6">
              <RoulettePanel
                title="배틀 상황"
                value={situationTitle || '대기 중'}
                items={situationReelItems}
                isSpinning={loadingStep === 'situation'}
                tone="emerald"
              />
            </div>
          )}

          {loadingStep === 'story' && (
            <div className="battle-story-row px-6 pb-6">
              <div className="story-loader overflow-hidden rounded-lg border-2 border-sky-200 bg-sky-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-sky-700">이야기 생성 중</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {storyLoadingMessages[storyMessageIndex]}
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5" aria-hidden="true">
                    <span className="story-equalizer h-7 w-3 rounded-full bg-sky-500 [animation-delay:-360ms]" />
                    <span className="story-equalizer h-10 w-3 rounded-full bg-rose-500 [animation-delay:-240ms]" />
                    <span className="story-equalizer h-8 w-3 rounded-full bg-emerald-500 [animation-delay:-120ms]" />
                    <span className="story-equalizer h-12 w-3 rounded-full bg-yellow-400" />
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                  <div className="story-progress h-full w-1/2 rounded-full bg-sky-500" />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      {notice && <div className="rounded-lg bg-amber-50 p-5 text-lg font-bold text-amber-900">{notice}</div>}
      <ErrorMessage message={error} />
      {error && (
        <button
          className="rounded-lg bg-rose-600 px-6 py-5 text-2xl font-black text-white hover:bg-rose-700"
          type="button"
          onClick={() => void startBattle()}
        >
          다시 배틀하기
        </button>
      )}
    </div>
  );
}
