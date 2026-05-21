type HomeProps = {
  studentNumber: number;
  onNavigate: (view: 'form' | 'book' | 'battle' | 'teacher') => void;
};

export function Home({ studentNumber, onNavigate }: HomeProps) {
  return (
    <div className="grid min-h-[calc(100vh-150px)] gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-8 rounded-lg bg-sky-50 p-6">
          <p className="text-2xl font-black text-sky-950">내 번호</p>
          <p className="mt-2 text-6xl font-black text-sky-800">{studentNumber}번</p>
        </div>
        <div className="grid h-[calc(100%-9rem)] min-h-[360px] gap-5">
          <button
            className="rounded-lg bg-sky-700 px-6 py-8 text-3xl font-black text-white hover:bg-sky-800"
            onClick={() => onNavigate('form')}
          >
            캐릭터 등록하기
          </button>
          <button
            className="rounded-lg bg-emerald-700 px-6 py-8 text-3xl font-black text-white hover:bg-emerald-800"
            onClick={() => onNavigate('book')}
          >
            내 캐릭터 보기
          </button>
        </div>
      </section>

      <section className="grid gap-5">
        <button
          className="rounded-lg bg-rose-600 px-6 py-10 text-3xl font-black text-white shadow-sm hover:bg-rose-700"
          onClick={() => onNavigate('battle')}
        >
          배틀 시작하기
        </button>
        <button
          className="rounded-lg bg-slate-700 px-6 py-10 text-3xl font-black text-white shadow-sm hover:bg-slate-800"
          onClick={() => onNavigate('teacher')}
        >
          교사용 관리
        </button>
      </section>
    </div>
  );
}
