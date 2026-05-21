type HomeProps = {
  studentNumber: number;
  onStudentNumberChange: (studentNumber: number) => void;
  onNavigate: (view: 'form' | 'book' | 'battle' | 'teacher') => void;
};

const MIN_STUDENT_NUMBER = 1;
const MAX_STUDENT_NUMBER = 99;

export function Home({ studentNumber, onStudentNumberChange, onNavigate }: HomeProps) {
  const updateStudentNumber = (nextNumber: number) => {
    if (Number.isInteger(nextNumber) && nextNumber >= MIN_STUDENT_NUMBER && nextNumber <= MAX_STUDENT_NUMBER) {
      onStudentNumberChange(nextNumber);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-150px)] gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-8 rounded-lg bg-sky-50 p-6">
          <p className="text-2xl font-black text-sky-950">내 번호</p>
          <div className="mt-4 grid grid-cols-[72px_1fr_72px] items-center gap-4">
            <button
              aria-label="번호 1 줄이기"
              className="h-[72px] rounded-lg bg-white text-5xl font-black text-sky-900 shadow-sm ring-2 ring-sky-100 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={studentNumber <= MIN_STUDENT_NUMBER}
              onClick={() => updateStudentNumber(studentNumber - 1)}
            >
              -
            </button>
            <div className="min-w-0 text-center">
              <p className="text-6xl font-black text-sky-800">{studentNumber}번</p>
              <label className="mt-4 block text-lg font-black text-sky-950" htmlFor="student-number-input">
                번호 직접 입력
              </label>
              <input
                id="student-number-input"
                className="mt-2 h-14 w-full rounded-lg border-2 border-sky-100 bg-white text-center text-3xl font-black text-sky-900 outline-none focus:border-sky-500"
                type="number"
                min={MIN_STUDENT_NUMBER}
                max={MAX_STUDENT_NUMBER}
                value={studentNumber}
                onChange={(event) => updateStudentNumber(Number(event.target.value))}
              />
            </div>
            <button
              aria-label="번호 1 늘리기"
              className="h-[72px] rounded-lg bg-white text-5xl font-black text-sky-900 shadow-sm ring-2 ring-sky-100 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={studentNumber >= MAX_STUDENT_NUMBER}
              onClick={() => updateStudentNumber(studentNumber + 1)}
            >
              +
            </button>
          </div>
        </div>
        <div className="grid min-h-[360px] gap-5">
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
