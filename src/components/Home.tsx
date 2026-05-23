import { useEffect, useState } from 'react';
import type { Character } from '../types';
import { getRandomBattleOpponentCandidates, getRepresentativeCharacter } from '../services/characterService';
import {
  DAILY_BATTLE_LIMIT_PER_CHARACTER,
  getBattleRecordsForStudentNumber,
  getRemainingDailyBattlesFromCount,
  getTodayBattleCountByCharacterId,
  type StudentBattleRecord,
} from '../services/battleService';
import { getBestCurrentWinStreak, type CharacterWinStreak } from '../utils/battleStreaks';
import { getUnreadIncomingBattleRecords } from '../utils/battleNotifications';
import { playChargeSound, playErrorSound, playStartSound } from '../utils/soundEffects';

type HomeProps = {
  studentNumber: number;
  canOpenTeacher: boolean;
  initialBattleNotice?: string;
  onNavigate: (view: 'form' | 'book' | 'battle' | 'history') => void;
  onTeacher: () => void;
};

export function Home({ studentNumber, canOpenTeacher, initialBattleNotice = '', onNavigate, onTeacher }: HomeProps) {
  const [representative, setRepresentative] = useState<Character | null>(null);
  const [incomingBattleCount, setIncomingBattleCount] = useState(0);
  const [incomingTargetName, setIncomingTargetName] = useState('');
  const [bestWinStreak, setBestWinStreak] = useState<CharacterWinStreak | null>(null);
  const [isLoadingRepresentative, setIsLoadingRepresentative] = useState(false);
  const [isBattleReady, setIsBattleReady] = useState(false);
  const [battleNotice, setBattleNotice] = useState('');
  const [isCheckingBattle, setIsCheckingBattle] = useState(false);

  const getIncomingTargetName = (records: StudentBattleRecord[], fallbackCharacter: Character | null) => {
    const targetNames = Array.from(
      new Set(records.map((record) => record.characterB?.name).filter((name): name is string => Boolean(name))),
    );

    if (targetNames.length === 1) return targetNames[0];
    if (targetNames.length > 1) return '내 캐릭터들';
    return fallbackCharacter?.name || '내 캐릭터';
  };

  useEffect(() => {
    setIsBattleReady(false);
    setBattleNotice('');
  }, [studentNumber]);

  useEffect(() => {
    setBattleNotice(initialBattleNotice);
    if (initialBattleNotice) setIsBattleReady(false);
  }, [initialBattleNotice]);

  const showBattleNotice = (message: string) => {
    playErrorSound();
    setBattleNotice(message);
    setIsBattleReady(false);
  };

  const handleBattleButtonClick = async () => {
    setBattleNotice('');

    if (!isBattleReady) {
      playChargeSound();
      setIsBattleReady(true);
      return;
    }

    if (isCheckingBattle) return;

    setIsCheckingBattle(true);
    try {
      const [latestRepresentative, opponentCandidates] = await Promise.all([
        getRepresentativeCharacter(studentNumber),
        getRandomBattleOpponentCandidates(studentNumber),
      ]);

      if (!latestRepresentative) {
        showBattleNotice('대표 캐릭터를 먼저 정해 주세요.');
        return;
      }

      if (opponentCandidates.length === 0) {
        showBattleNotice('배틀할 수 있는 다른 대표 캐릭터가 아직 없어요.');
        return;
      }

      const todayBattleCountByCharacterId = await getTodayBattleCountByCharacterId([latestRepresentative.id]);
      const remainingBattles = getRemainingDailyBattlesFromCount(
        todayBattleCountByCharacterId.get(latestRepresentative.id) ?? 0,
      );

      if (remainingBattles <= 0) {
        showBattleNotice(`오늘 이 캐릭터의 배틀 횟수 ${DAILY_BATTLE_LIMIT_PER_CHARACTER}회를 모두 사용했습니다.`);
        return;
      }

      playStartSound();
      onNavigate('battle');
    } catch {
      showBattleNotice('배틀 준비 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsCheckingBattle(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingRepresentative(true);

    Promise.all([
      getRepresentativeCharacter(studentNumber),
      getBattleRecordsForStudentNumber(studentNumber),
    ])
      .then(([character, records]) => {
        if (!isMounted) return;
        const unreadIncomingRecords = getUnreadIncomingBattleRecords(studentNumber, records);
        const myCharactersById = new Map<string, Character>();

        records.forEach((record) => {
          [record.characterA, record.characterB].forEach((recordCharacter) => {
            if (recordCharacter?.student_number === studentNumber) {
              myCharactersById.set(recordCharacter.id, recordCharacter);
            }
          });
        });
        if (character) {
          myCharactersById.set(character.id, character);
        }

        setRepresentative(character);
        setIncomingBattleCount(unreadIncomingRecords.length);
        setIncomingTargetName(getIncomingTargetName(unreadIncomingRecords, character));
        setBestWinStreak(getBestCurrentWinStreak(Array.from(myCharactersById.values()), records));
      })
      .catch(() => {
        if (!isMounted) return;
        setRepresentative(null);
        setIncomingBattleCount(0);
        setIncomingTargetName('');
        setBestWinStreak(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRepresentative(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentNumber]);

  return (
    <div className="home-shell">
      <div className="home-intro mx-auto mb-5 max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white">
        <img
          className="block h-[clamp(240px,48svh,470px)] w-full object-contain object-center"
          src="/intro.png"
          alt="캐릭터 문단 배틀 소개 일러스트"
        />
      </div>
      <section className="home-board mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="home-command-grid grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_12rem] lg:items-stretch">
          <div className="home-number-card rounded-lg border-2 border-slate-200 bg-slate-50 p-5">
            <p className="block text-base font-black text-slate-500">
              번호
            </p>
            <div className="mt-3 grid grid-cols-[1fr_3rem] overflow-hidden rounded-lg border-2 border-slate-200 bg-white">
              <div className="flex h-20 min-w-0 items-center justify-center px-3 text-center text-5xl font-black text-slate-950">
                {studentNumber}
              </div>
              <div className="flex items-center justify-center border-l-2 border-slate-200 bg-slate-50 text-xl font-black text-slate-600">
                번
              </div>
            </div>
          </div>

          <div className="versus-matchup grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="matchup-card matchup-card-left rounded-lg border-2 border-sky-100 bg-sky-50 p-6">
              <p className="text-base font-black text-sky-700">내 캐릭터</p>
              <p className="matchup-name mt-5 text-5xl font-black text-slate-950">
                {isLoadingRepresentative ? '확인 중' : representative?.name || '없음'}
              </p>
            </div>

            <button
              className={`versus-badge flex items-center justify-center rounded-lg bg-slate-950 px-5 py-4 text-3xl font-black text-white ${
                isBattleReady ? 'versus-badge-ready' : ''
              }`}
              type="button"
              data-sound-effect="custom"
              disabled={isCheckingBattle}
              onClick={() => void handleBattleButtonClick()}
            >
              {isCheckingBattle ? '확인 중' : isBattleReady ? '배틀 시작' : 'VS'}
            </button>

            <div className="matchup-card matchup-card-right rounded-lg border-2 border-rose-100 bg-rose-50 p-6">
              <p className="text-base font-black text-rose-700">상대</p>
              <p className="matchup-name mt-5 text-5xl font-black text-slate-950">???</p>
            </div>
          </div>

        </div>

        <div className="home-nav-grid mt-4 grid gap-3 sm:grid-cols-3">
          <button
            className="rounded-lg border-2 border-slate-200 bg-white px-5 py-4 text-xl font-black text-slate-900 transition hover:border-slate-400"
            onClick={() => onNavigate('form')}
          >
            캐릭터 등록
          </button>
          <button
            className="rounded-lg border-2 border-slate-200 bg-white px-5 py-4 text-xl font-black text-slate-900 transition hover:border-slate-400"
            onClick={() => onNavigate('book')}
          >
            캐릭터 보기
          </button>
          <button
            className="rounded-lg border-2 border-slate-200 bg-white px-5 py-4 text-xl font-black text-slate-900 transition hover:border-slate-400"
            onClick={() => onNavigate('history')}
          >
            기록 보기
            {incomingBattleCount > 0 && (
              <span className="ml-2 rounded-full bg-rose-600 px-2.5 py-1 text-sm font-black text-white">
                🔔 새 알림 {incomingBattleCount}
              </span>
            )}
          </button>
        </div>

        {canOpenTeacher && (
          <button
            className="mt-3 w-full rounded-lg border-2 border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-900 transition hover:border-slate-400"
            type="button"
            onClick={onTeacher}
          >
            교사용 관리
          </button>
        )}

        {incomingBattleCount > 0 && (
          <button
            className="home-alert-button mt-4 flex w-full items-center gap-3 rounded-lg border-2 border-black bg-amber-300 px-5 py-4 text-left transition hover:bg-amber-200"
            type="button"
            onClick={() => onNavigate('history')}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-2xl">
              ⚔️
            </span>
            <span className="min-w-0 text-lg font-black text-slate-950">
              {incomingBattleCount}명이 {incomingTargetName}에게 도전했어요!
            </span>
          </button>
        )}

        {battleNotice && (
          <div className="mt-4 rounded-lg border-2 border-rose-200 bg-rose-50 px-5 py-4 text-lg font-black text-rose-800">
            {battleNotice}
          </div>
        )}

        {bestWinStreak && (
          <button
            className="mt-4 flex w-full items-center gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 px-5 py-4 text-left transition hover:bg-amber-100"
            type="button"
            onClick={() => onNavigate('book')}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300 text-base font-black text-amber-950">
              {bestWinStreak.wins}
            </span>
            <span className="min-w-0 text-lg font-black text-slate-950">
              {bestWinStreak.characterName}이 {bestWinStreak.wins}연승 중이에요!
            </span>
          </button>
        )}

        {!representative && !isLoadingRepresentative && (
          <div className="mt-4 rounded-lg bg-amber-50 px-5 py-4 text-lg font-black text-amber-900">
            대표 캐릭터가 필요합니다.
          </div>
        )}
      </section>
    </div>
  );
}
