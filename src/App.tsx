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

export default function App() {
  const [view, setView] = useState<View>('home');
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(null);
  const [studentNumber, setStudentNumber] = useState(1);

  return (
    <Layout
      isHome={view === 'home'}
      onHome={() => setView('home')}
    >
      {view === 'home' && (
        <Home
          studentNumber={studentNumber}
          onStudentNumberChange={setStudentNumber}
          onNavigate={(nextView) => setView(nextView)}
        />
      )}
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
    </Layout>
  );
}
