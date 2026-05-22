import { useState } from 'react';
import type { BattleResult as BattleResultType, Character, Situation } from './types';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { CharacterForm } from './components/CharacterForm';
import { CharacterBook } from './components/CharacterBook';
import { BattleStart } from './components/BattleStart';
import { BattleResult } from './components/BattleResult';
import { TeacherDashboard } from './components/TeacherDashboard';

type View = 'home' | 'form' | 'book' | 'battle' | 'result' | 'teacher';

type ResultPayload = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

const STUDENT_NUMBER_STORAGE_KEY = 'text-battle-student-number';
const MIN_STUDENT_NUMBER = 1;
const MAX_STUDENT_NUMBER = 23;

const viewTitles: Record<View, string> = {
  home: '캐릭터 문단 배틀',
  form: '캐릭터 등록하기',
  book: '내 캐릭터',
  battle: '배틀하기',
  result: '배틀 결과',
  teacher: '교사용 관리',
};

function getSavedStudentNumber() {
  const savedValue = window.localStorage.getItem(STUDENT_NUMBER_STORAGE_KEY);
  const savedNumber = savedValue ? Number(savedValue) : 1;
  return Number.isInteger(savedNumber) && savedNumber >= MIN_STUDENT_NUMBER && savedNumber <= MAX_STUDENT_NUMBER
    ? savedNumber
    : 1;
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(null);
  const [studentNumber, setStudentNumberState] = useState(getSavedStudentNumber);

  const setStudentNumber = (nextStudentNumber: number) => {
    setStudentNumberState(nextStudentNumber);
    window.localStorage.setItem(STUDENT_NUMBER_STORAGE_KEY, String(nextStudentNumber));
  };

  return (
    <Layout
      title={viewTitles[view]}
      isHome={view === 'home'}
      onHome={() => setView('home')}
      onTeacher={() => setView('teacher')}
    >
      {view === 'home' && (
        <Home
          studentNumber={studentNumber}
          onStudentNumberChange={setStudentNumber}
          onNavigate={(nextView) => setView(nextView)}
        />
      )}
      {view === 'form' && (
        <CharacterForm
          initialStudentNumber={studentNumber}
          showTitle={false}
          onChooseNext={(nextView) => setView(nextView)}
        />
      )}
      {view === 'book' && <CharacterBook initialStudentNumber={studentNumber} />}
      {view === 'battle' && (
        <BattleStart
          initialStudentNumber={studentNumber}
          onResult={(payload) => {
            setResultPayload(payload);
            setView('result');
          }}
        />
      )}
      {view === 'result' && resultPayload && <BattleResult {...resultPayload} />}
      {view === 'teacher' && <TeacherDashboard />}
    </Layout>
  );
}
