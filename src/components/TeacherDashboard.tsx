import { useEffect, useMemo, useState } from 'react';
import type { BattleRecord, Character, RewriteLog } from '../types';
import { deleteCharacter, getAllCharacters, setRepresentativeCharacter } from '../services/characterService';
import { getRecentBattleRecords } from '../services/battleService';
import { getRecentRewriteLogs } from '../services/rewriteService';
import { getTopicSentence } from '../utils/characterText';
import { ErrorMessage } from './ErrorMessage';
import { LoadingMessage } from './LoadingMessage';

export function TeacherDashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [battleRecords, setBattleRecords] = useState<BattleRecord[]>([]);
  const [rewriteLogs, setRewriteLogs] = useState<RewriteLog[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setError('');
    setIsLoading(true);
    try {
      const [allCharacters, battles, rewrites] = await Promise.all([
        getAllCharacters(),
        getRecentBattleRecords(10),
        getRecentRewriteLogs(10),
      ]);
      setCharacters(allCharacters);
      setBattleRecords(battles);
      setRewriteLogs(rewrites);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const summaries = useMemo(() => {
    const map = new Map<number, { count: number; representative?: Character }>();
    characters.forEach((character) => {
      const current = map.get(character.student_number) || { count: 0 };
      current.count += 1;
      if (character.is_representative) current.representative = character;
      map.set(character.student_number, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [characters]);

  const handleDelete = async (character: Character) => {
    if (!window.confirm('이 캐릭터를 삭제할까요?')) return;
    try {
      await deleteCharacter(character.id);
      await loadData();
    } catch {
      setError('캐릭터를 삭제하지 못했습니다.');
    }
  };

  const handleRepresentative = async (character: Character) => {
    try {
      await setRepresentativeCharacter(character.student_number, character.id);
      await loadData();
    } catch {
      setError('대표 캐릭터를 정하지 못했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-black text-sky-950">교사용 관리</h2>
        <button className="mt-4 rounded-lg bg-sky-700 px-5 py-3 text-lg font-bold text-white hover:bg-sky-800" onClick={() => void loadData()}>
          새로고침
        </button>
      </section>
      {isLoading && <LoadingMessage message="불러오는 중" />}
      <ErrorMessage message={error} />
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-2xl font-black text-slate-900">번호별</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {summaries.map(([studentNumber, summary]) => (
            <div key={studentNumber} className="rounded-lg border-2 border-slate-100 p-4 text-lg">
              <p><strong>{studentNumber}번</strong></p>
              <p>수: {summary.count}</p>
              <p>대표: {summary.representative ? summary.representative.name : '없음'}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-2xl font-black text-slate-900">전체 캐릭터</h3>
        <div className="space-y-4">
          {characters.map((character) => (
            <div key={character.id} className="rounded-lg border-2 border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-xl">{character.student_number}번 {character.name}</strong>
                {character.is_representative && <span className="rounded-full bg-yellow-200 px-3 py-1 font-black text-yellow-900">★ 대표</span>}
              </div>
              <p className="mt-2 text-lg leading-8">{getTopicSentence(character)}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {!character.is_representative && (
                  <button className="rounded-lg bg-yellow-500 px-4 py-2 font-bold text-white" onClick={() => void handleRepresentative(character)}>
                    대표로 정하기
                  </button>
                )}
                <button className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white" onClick={() => void handleDelete(character)}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-2xl font-black text-slate-900">최근 배틀</h3>
          <div className="space-y-3">
            {battleRecords.map((record) => (
              <div key={record.id} className="rounded-lg bg-slate-50 p-4 text-lg leading-7">
                <p><strong>상황:</strong> {record.situation_text}</p>
                <p><strong>이유:</strong> {record.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-2xl font-black text-slate-900">고쳐쓰기</h3>
          <div className="space-y-3">
            {rewriteLogs.map((log) => (
              <div key={log.id} className="rounded-lg bg-slate-50 p-4 text-lg leading-7">
                <p><strong>{log.student_number}번</strong> {log.field_name}</p>
                <p>{log.before_text} → {log.after_text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
