type HomeProps = {
  onNavigate: (view: 'form' | 'book' | 'battle' | 'teacher') => void;
};

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-black text-sky-950 md:text-5xl">캐릭터 문단 배틀</h1>
        <p className="mt-4 text-2xl font-bold text-sky-800">중심문장과 뒷받침문장으로 캐릭터를 만들어 배틀해요!</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button className="rounded-lg bg-sky-700 px-6 py-5 text-2xl font-black text-white hover:bg-sky-800" onClick={() => onNavigate('form')}>캐릭터 등록하기</button>
          <button className="rounded-lg bg-emerald-700 px-6 py-5 text-2xl font-black text-white hover:bg-emerald-800" onClick={() => onNavigate('book')}>내 캐릭터 도감</button>
          <button className="rounded-lg bg-rose-600 px-6 py-5 text-2xl font-black text-white hover:bg-rose-700" onClick={() => onNavigate('battle')}>배틀 시작하기</button>
          <button className="rounded-lg bg-slate-700 px-6 py-5 text-2xl font-black text-white hover:bg-slate-800" onClick={() => onNavigate('teacher')}>교사용 관리</button>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border-2 border-sky-100 bg-white p-6">
          <h2 className="text-2xl font-black text-sky-900">중심문장</h2>
          <p className="mt-3 text-xl leading-8">캐릭터가 어떤 능력을 가졌는지 알려 주는 문장</p>
        </div>
        <div className="rounded-lg border-2 border-emerald-100 bg-white p-6">
          <h2 className="text-2xl font-black text-emerald-900">뒷받침문장</h2>
          <p className="mt-3 text-xl leading-8">중심문장의 내용을 자세히 설명하는 문장</p>
        </div>
      </section>
    </div>
  );
}
