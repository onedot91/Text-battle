import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  onHome: () => void;
};

export function Layout({ children, onHome }: LayoutProps) {
  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b-4 border-sky-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button className="text-left text-2xl font-black text-sky-900" onClick={onHome}>
            캐릭터 문단 배틀
          </button>
          <button
            className="rounded-lg bg-sky-700 px-5 py-3 text-lg font-bold text-white hover:bg-sky-800"
            onClick={onHome}
          >
            홈으로
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
