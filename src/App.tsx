import { useEffect, useState } from 'react';
import type { BattleResult as BattleResultType, Character, Situation } from './types';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { CharacterForm } from './components/CharacterForm';
import { CharacterBook } from './components/CharacterBook';
import { BattleStart } from './components/BattleStart';
import { BattleResult } from './components/BattleResult';
import { TeacherDashboard } from './components/TeacherDashboard';
import { BattleHistory } from './components/BattleHistory';
import { InitialStudentNumberSelect } from './components/InitialStudentNumberSelect';
import { resetBattleRecords, resetCharacters } from './services/resetService';
import { playButtonSound, playTypeSound } from './utils/soundEffects';

type View = 'home' | 'form' | 'book' | 'battle' | 'result' | 'history' | 'teacher';
type ResetTarget = 'characters' | 'battleRecords';

type ResultPayload = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

const STUDENT_NUMBER_STORAGE_KEY = 'text-battle-student-number';
const PENDING_BATTLE_RESULT_STORAGE_PREFIX = 'text-battle-pending-result';
const MIN_STUDENT_NUMBER = 1;
const MAX_STUDENT_NUMBER = 23;
const HIDDEN_TEACHER_STUDENT_NUMBER = 0;
const MORNING_ACTIVITY_START_HOUR = 8;
const MORNING_ACTIVITY_END_HOUR = 9;

const viewTitles: Record<View, string> = {
  home: '',
  form: '캐릭터 등록하기',
  book: '내 캐릭터',
  battle: '배틀하기',
  result: '배틀 결과',
  history: '기록 보기',
  teacher: '교사용 관리',
};

function getSavedStudentNumber() {
  const savedValue = window.localStorage.getItem(STUDENT_NUMBER_STORAGE_KEY);
  if (!savedValue) return null;

  const savedNumber = Number(savedValue);
  return Number.isInteger(savedNumber) &&
    (savedNumber === HIDDEN_TEACHER_STUDENT_NUMBER ||
      (savedNumber >= MIN_STUDENT_NUMBER && savedNumber <= MAX_STUDENT_NUMBER))
    ? savedNumber
    : null;
}

function getPendingBattleResultStorageKey(studentNumber: number) {
  return `${PENDING_BATTLE_RESULT_STORAGE_PREFIX}-${studentNumber}`;
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isPendingBattleResultPayload(value: unknown): value is ResultPayload {
  if (!isRecordObject(value)) return false;
  const { characterA, characterB, situation, result } = value;
  if (!isRecordObject(characterA) || !isRecordObject(characterB)) return false;
  if (!isRecordObject(situation) || !isRecordObject(result)) return false;

  return (
    typeof characterA.id === 'string' &&
    typeof characterA.student_number === 'number' &&
    typeof characterB.id === 'string' &&
    typeof characterB.student_number === 'number' &&
    typeof situation.id === 'string' &&
    typeof situation.title === 'string' &&
    typeof situation.text === 'string' &&
    typeof result.story === 'string' &&
    typeof result.winnerCharacterId === 'string' &&
    typeof result.winnerName === 'string' &&
    (result.winner === 'A' || result.winner === 'B')
  );
}

function readPendingBattleResult(studentNumber: number) {
  const rawValue = window.localStorage.getItem(getPendingBattleResultStorageKey(studentNumber));
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue);
    return isPendingBattleResultPayload(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function savePendingBattleResult(studentNumber: number, payload: ResultPayload) {
  window.localStorage.setItem(getPendingBattleResultStorageKey(studentNumber), JSON.stringify(payload));
}

function clearPendingBattleResult(studentNumber: number) {
  window.localStorage.removeItem(getPendingBattleResultStorageKey(studentNumber));
}

function isMorningActivityTime(date: Date) {
  const hour = date.getHours();
  return hour >= MORNING_ACTIVITY_START_HOUR && hour < MORNING_ACTIVITY_END_HOUR;
}

function MorningActivityModal() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-5 py-6">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg border-2 border-black bg-white shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="morning-activity-title"
        aria-describedby="morning-activity-description"
      >
        <img
          className="block aspect-[2/1] w-full object-cover"
          src="/morning-activity.png"
          alt="상상도 못한 정체"
        />
        <div className="p-6 text-center sm:p-8">
          <h2
            id="morning-activity-title"
            className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-5xl"
          >
            아침활동 시간
          </h2>
          <p
            id="morning-activity-description"
            className="mt-4 text-xl font-bold leading-8 text-slate-800 sm:text-2xl"
          >
            8시부터 9시까지 사용할 수 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [studentNumber, setStudentNumberState] = useState(getSavedStudentNumber);
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(() => {
    const savedStudentNumber = getSavedStudentNumber();
    return savedStudentNumber === null ? null : readPendingBattleResult(savedStudentNumber);
  });
  const [view, setView] = useState<View>(() => (resultPayload ? 'result' : 'home'));
  const [teacherRefreshKey, setTeacherRefreshKey] = useState(0);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetError, setResetError] = useState('');
  const [homeBattleNotice, setHomeBattleNotice] = useState('');
  const [isBlockedByMorningActivity, setIsBlockedByMorningActivity] = useState(() =>
    isMorningActivityTime(new Date()),
  );

  const setStudentNumber = (nextStudentNumber: number) => {
    setStudentNumberState(nextStudentNumber);
    window.localStorage.setItem(STUDENT_NUMBER_STORAGE_KEY, String(nextStudentNumber));
    const pendingResult = readPendingBattleResult(nextStudentNumber);
    if (pendingResult) {
      setResultPayload(pendingResult);
      setView('result');
    }
  };

  const resetStudentNumber = () => {
    window.localStorage.removeItem(STUDENT_NUMBER_STORAGE_KEY);
    setStudentNumberState(null);
    setResultPayload(null);
    setView('home');
  };

  useEffect(() => {
    if (studentNumber === null || view === 'result') return;

    const pendingResult = readPendingBattleResult(studentNumber);
    if (!pendingResult) return;

    setResultPayload(pendingResult);
    setView('result');
  }, [studentNumber, view]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === 'Enter') {
        event.preventDefault();
        resetStudentNumber();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleButtonClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('button');
      if (!button || button.disabled || button.dataset.soundEffect === 'custom') return;

      playButtonSound();
    };

    window.addEventListener('click', handleButtonClick, true);
    return () => window.removeEventListener('click', handleButtonClick, true);
  }, []);

  useEffect(() => {
    const handleTextInputKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1 && event.key !== 'Backspace' && event.key !== 'Delete') return;

      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (target.disabled || target.readOnly) return;

      playTypeSound();
    };

    window.addEventListener('keydown', handleTextInputKeyDown, true);
    return () => window.removeEventListener('keydown', handleTextInputKeyDown, true);
  }, []);

  useEffect(() => {
    const updateMorningActivityBlock = () => {
      setIsBlockedByMorningActivity(isMorningActivityTime(new Date()));
    };

    updateMorningActivityBlock();
    const intervalId = window.setInterval(updateMorningActivityBlock, 30 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const clearLocalBattleNotificationState = () => {
    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith('text-battle-seen-incoming-records-')) {
        window.localStorage.removeItem(key);
      }
    });
  };

  const openResetModal = (target: ResetTarget) => {
    setResetError('');
    setResetTarget(target);
  };

  const handleResetData = async () => {
    if (!resetTarget) return;

    setResetError('');
    setIsResettingData(true);
    try {
      if (resetTarget === 'characters') {
        await resetCharacters();
        clearLocalBattleNotificationState();
        setResultPayload(null);
      } else {
        await resetBattleRecords();
        clearLocalBattleNotificationState();
        setResultPayload(null);
      }

      setResetTarget(null);
      setTeacherRefreshKey((current) => current + 1);
    } catch {
      setResetError('초기화에 실패했습니다. 잠시 후 다시 시도하세요.');
    } finally {
      setIsResettingData(false);
    }
  };

  const resetDialogTitle =
    resetTarget === 'characters'
      ? '정말 캐릭터를 초기화할까요?'
      : '정말 배틀 기록을 초기화할까요?';
  const resetDialogDescription =
    resetTarget === 'characters'
      ? '모든 학생의 캐릭터가 삭제됩니다. 캐릭터와 연결된 배틀 기록도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.'
      : '모든 배틀 기록이 삭제됩니다. 캐릭터는 그대로 남지만, 이 작업은 되돌릴 수 없습니다.';
  const resetConfirmLabel =
    resetTarget === 'characters' ? '캐릭터 초기화' : '배틀 기록 초기화';

  return (
    <Layout
      isHome={view === 'home'}
    >
      {studentNumber === null && view === 'home' && (
        <InitialStudentNumberSelect
          minStudentNumber={MIN_STUDENT_NUMBER}
          maxStudentNumber={MAX_STUDENT_NUMBER}
          hiddenStudentNumber={HIDDEN_TEACHER_STUDENT_NUMBER}
          onSelect={setStudentNumber}
        />
      )}
      {studentNumber !== null && view === 'home' && (
        <Home
          studentNumber={studentNumber}
          canOpenTeacher={studentNumber === HIDDEN_TEACHER_STUDENT_NUMBER}
          initialBattleNotice={homeBattleNotice}
          onNavigate={(nextView) => {
            setHomeBattleNotice('');
            setView(nextView);
          }}
          onTeacher={() => setView('teacher')}
        />
      )}
      {studentNumber !== null && view === 'form' && (
        <CharacterForm
          initialStudentNumber={studentNumber}
          showTitle={false}
          onHome={() => setView('home')}
          onChooseNext={(nextView) => setView(nextView)}
        />
      )}
      {studentNumber !== null && view === 'book' && (
        <CharacterBook initialStudentNumber={studentNumber} onHome={() => setView('home')} />
      )}
      {studentNumber !== null && view === 'history' && (
        <BattleHistory studentNumber={studentNumber} onHome={() => setView('home')} />
      )}
      {studentNumber !== null && view === 'battle' && (
        <BattleStart
          initialStudentNumber={studentNumber}
          onResult={(payload) => {
            savePendingBattleResult(studentNumber, payload);
            setResultPayload(payload);
            setView('result');
          }}
          onUnavailable={(message) => {
            setHomeBattleNotice(message);
            setView('home');
          }}
        />
      )}
      {view === 'result' && resultPayload && (
        <BattleResult
          {...resultPayload}
          onComplete={() => {
            if (studentNumber !== null) clearPendingBattleResult(studentNumber);
          }}
          onHome={() => setView('home')}
        />
      )}
      {view === 'teacher' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-4xl font-black text-slate-950">{viewTitles.teacher}</h1>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-red-700 px-6 py-4 text-xl font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isTeacherLoading || isResettingData}
                onClick={() => openResetModal('characters')}
              >
                캐릭터 초기화
              </button>
              <button
                className="rounded-lg bg-red-700 px-6 py-4 text-xl font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isTeacherLoading || isResettingData}
                onClick={() => openResetModal('battleRecords')}
              >
                배틀 기록 초기화
              </button>
              <button
                className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-sky-700 text-3xl font-black leading-none text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isTeacherLoading || isResettingData}
                onClick={() => setTeacherRefreshKey((current) => current + 1)}
                aria-label="새로고침"
                title="새로고침"
              >
                ↻
              </button>
              <button
                className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-sky-700 text-3xl font-black leading-none text-white hover:bg-sky-800"
                onClick={() => setView('home')}
                aria-label="처음으로"
                title="처음으로"
              >
                ⌂
              </button>
            </div>
          </div>
          <TeacherDashboard
            refreshKey={teacherRefreshKey}
            onLoadingChange={setIsTeacherLoading}
          />
        </div>
      )}
      {resetTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6">
          <div
            className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-all-title"
            aria-describedby="reset-all-description"
          >
            <h2 id="reset-all-title" className="text-3xl font-black text-slate-950">
              {resetDialogTitle}
            </h2>
            <p id="reset-all-description" className="mt-4 text-lg font-bold leading-8 text-slate-700">
              {resetDialogDescription}
            </p>
            {resetError && (
              <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-base font-black text-rose-900">
                {resetError}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border-2 border-slate-200 bg-white px-6 py-4 text-xl font-black text-slate-900 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={isResettingData}
                onClick={() => setResetTarget(null)}
              >
                취소
              </button>
              <button
                className="rounded-lg bg-red-700 px-6 py-4 text-xl font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={isResettingData}
                onClick={() => void handleResetData()}
              >
                {isResettingData ? '초기화 중' : resetConfirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {isBlockedByMorningActivity && <MorningActivityModal />}
    </Layout>
  );
}
