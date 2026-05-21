import { useState } from 'react';
import type { BattleResult as BattleResultType, Character, Situation } from './types';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { CharacterForm } from './components/CharacterForm';
import { CharacterBook } from './components/CharacterBook';
import { BattleStart } from './components/BattleStart';
import { BattleResult } from './components/BattleResult';
import { TeacherDashboard } from './components/TeacherDashboard';
import { validateStudentNumber } from './utils/validators';

type View = 'home' | 'form' | 'book' | 'battle' | 'result' | 'teacher';

type ResultPayload = {
  characterA: Character;
  characterB: Character;
  situation: Situation;
  result: BattleResultType;
};

export default function App() {
  const [view, setView] = useState<View>('home');
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(null);
  const [studentNumber, setStudentNumber] = useState(1);
  const [numberDraft, setNumberDraft] = useState('1');
  const [isNumberOpen, setIsNumberOpen] = useState(false);
  const [numberError, setNumberError] = useState('');

  const openNumber = () => {
    setNumberDraft(String(studentNumber));
    setNumberError('');
    setIsNumberOpen(true);
  };

  const saveNumber = () => {
    const validationError = validateStudentNumber(numberDraft);
    if (validationError) {
      setNumberError(validationError);
      return;
    }
    setStudentNumber(Number(numberDraft));
    setIsNumberOpen(false);
  };

  return (
    <Layout
      isHome={view === 'home'}
      studentNumber={studentNumber}
      onHome={() => setView('home')}
      onOpenNumber={openNumber}
    >
      {view === 'home' && <Home studentNumber={studentNumber} onNavigate={(nextView) => setView(nextView)} />}
      {view === 'form' && <CharacterForm initialStudentNumber={studentNumber} />}
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
      {isNumberOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-5">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black text-sky-950">번호 설정</h2>
            <input
              className="mt-5 w-full rounded-lg border-2 border-slate-200 px-4 py-4 text-3xl font-black"
              type="number"
              min="1"
              max="99"
              value={numberDraft}
              onChange={(event) => setNumberDraft(event.target.value)}
            />
            {numberError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-lg font-bold text-red-700">{numberError}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-lg bg-slate-200 px-5 py-4 text-xl font-black text-slate-900"
                onClick={() => setIsNumberOpen(false)}
              >
                닫기
              </button>
              <button
                className="rounded-lg bg-sky-700 px-5 py-4 text-xl font-black text-white"
                onClick={saveNumber}
              >
                저장하기
              </button>
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
}
