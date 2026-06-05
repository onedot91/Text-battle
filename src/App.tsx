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
import { resetAllClassroomData } from './services/resetService';
import { playButtonSound, playTypeSound } from './utils/soundEffects';

type View = 'home' | 'form' | 'book' | 'battle' | 'result' | 'history' | 'teacher';

type ResultPayload = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

const STUDENT_NUMBER_STORAGE_KEY = 'text-battle-student-number';
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
  const [view, setView] = useState<View>('home');
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(null);
  const [studentNumber, setStudentNumberState] = useState(getSavedStudentNumber);
  const [teacherRefreshKey, setTeacherRefreshKey] = useState(0);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResettingClassroom, setIsResettingClassroom] = useState(false);
  const [resetError, setResetError] = useState('');
  const [homeBattleNotice, setHomeBattleNotice] = useState('');
  const [isBlockedByMorningActivity, setIsBlockedByMorningActivity] = useState(() =>
    isMorningActivityTime(new Date()),
  );

  const setStudentNumber = (nextStudentNumber: number) => {
    setStudentNumberState(nextStudentNumber);
    window.localStorage.setItem(STUDENT_NUMBER_STORAGE_KEY, String(nextStudentNumber));
  };

  const resetStudentNumber = () => {
    window.localStorage.removeItem(STUDENT_NUMBER_STORAGE_KEY);
    setStudentNumberState(null);
    setResultPayload(null);
    setView('home');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'Enter') {
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

  const handleResetAllClassroomData = async () => {
    setResetError('');
    setIsResettingClassroom(true);
    try {
      await resetAllClassroomData();
      clearLocalBattleNotificationState();
      setResultPayload(null);
      setIsResetModalOpen(false);
      setTeacherRefreshKey((current) => current + 1);
    } catch {
      setResetError('전면 초기화에 실패했습니다. 잠시 후 다시 시도하세요.');
    } finally {
      setIsResettingClassroom(false);
    }
  };

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
                disabled={isTeacherLoading || isResettingClassroom}
                onClick={() => {
                  setResetError('');
                  setIsResetModalOpen(true);
                }}
              >
                전면 초기화
              </button>
              <button
                className="rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isTeacherLoading || isResettingClassroom}
                onClick={() => setTeacherRefreshKey((current) => current + 1)}
              >
                {isTeacherLoading ? '불러오는 중' : '새로고침'}
              </button>
              <button
                className="rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white hover:bg-sky-800"
                onClick={() => setView('home')}
              >
                처음으로
              </button>
            </div>
          </div>
          <TeacherDashboard
            refreshKey={teacherRefreshKey}
            onLoadingChange={setIsTeacherLoading}
          />
        </div>
      )}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6">
          <div
            className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-all-title"
            aria-describedby="reset-all-description"
          >
            <h2 id="reset-all-title" className="text-3xl font-black text-slate-950">
              정말 전면 초기화할까요?
            </h2>
            <p id="reset-all-description" className="mt-4 text-lg font-bold leading-8 text-slate-700">
              모든 캐릭터와 배틀 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
                disabled={isResettingClassroom}
                onClick={() => setIsResetModalOpen(false)}
              >
                취소
              </button>
              <button
                className="rounded-lg bg-red-700 px-6 py-4 text-xl font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={isResettingClassroom}
                onClick={() => void handleResetAllClassroomData()}
              >
                {isResettingClassroom ? '초기화 중' : '전면 초기화'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isBlockedByMorningActivity && <MorningActivityModal />}
    </Layout>
  );
}
