import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  isHome: boolean;
};

export function Layout({
  children,
  isHome,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <main className={`mx-auto max-w-7xl px-6 py-8 ${isHome ? 'home-main' : ''}`}>{children}</main>
    </div>
  );
}
