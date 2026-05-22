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

export default function App() {
  const [view, setView] = useState<View>('home');
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(null);
  const [studentNumber, setStudentNumberState] = useState(getSavedStudentNumber);
  const [teacherRefreshKey, setTeacherRefreshKey] = useState(0);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResettingClassroom, setIsResettingClassroom] = useState(false);
  const [resetError, setResetError] = useState('');

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
          onNavigate={(nextView) => setView(nextView)}
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
              모든 캐릭터, 배틀 기록, 고쳐쓰기 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
    </Layout>
  );
}
