import { useState } from 'react';

type InitialStudentNumberSelectProps = {
  minStudentNumber: number;
  maxStudentNumber: number;
  hiddenStudentNumber: number;
  onSelect: (studentNumber: number) => void;
};

const HIDDEN_NUMBER_UNLOCK_CLICK_COUNT = 3;

export function InitialStudentNumberSelect({
  minStudentNumber,
  maxStudentNumber,
  hiddenStudentNumber,
  onSelect,
}: InitialStudentNumberSelectProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [hiddenTitleClickCount, setHiddenTitleClickCount] = useState(0);
  const [isHiddenNumberUnlocked, setIsHiddenNumberUnlocked] = useState(false);
  const studentNumbers = Array.from(
    { length: maxStudentNumber - minStudentNumber + 1 },
    (_, index) => minStudentNumber + index,
  );
  const selectableNumbers = isHiddenNumberUnlocked ? [hiddenStudentNumber, ...studentNumbers] : studentNumbers;

  const confirmSelection = () => {
    if (selectedNumber !== null) {
      onSelect(selectedNumber);
    }
  };

  const unlockHiddenNumber = () => {
    if (isHiddenNumberUnlocked) return;

    const nextCount = hiddenTitleClickCount + 1;
    if (nextCount >= HIDDEN_NUMBER_UNLOCK_CLICK_COUNT) {
      setIsHiddenNumberUnlocked(true);
      setSelectedNumber(hiddenStudentNumber);
      return;
    }

    setHiddenTitleClickCount(nextCount);
  };

  return (
    <div className="home-shell">
      <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-950">
              <span
                className="cursor-default select-none"
                role="button"
                tabIndex={0}
                aria-label="히든 번호 생성 버튼"
                onClick={unlockHiddenNumber}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    unlockHiddenNumber();
                  }
                }}
              >
                내
              </span>{' '}
              번호를 선택하세요
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
            {selectableNumbers.map((studentNumber) => {
              const isSelected = selectedNumber === studentNumber;

              return (
                <button
                  key={studentNumber}
                  className={`min-h-16 rounded-lg border-2 px-3 py-4 text-2xl font-black transition ${
                    isSelected
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-950 hover:border-slate-400'
                  }`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedNumber(studentNumber)}
                >
                  {studentNumber}
                </button>
              );
            })}
          </div>

          <button
            className="rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={selectedNumber === null}
            onClick={confirmSelection}
          >
            {selectedNumber === null ? '번호 선택' : `${selectedNumber}번으로 시작`}
          </button>
        </div>
      </section>
    </div>
  );
}
