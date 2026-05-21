import { useEffect, useState, type ReactNode } from 'react';
import { checkFirestoreConnection } from '../services/firebaseStatusService';
import { isGeminiConfigured } from '../services/geminiStatusService';

type LayoutProps = {
  children: ReactNode;
  isHome: boolean;
  onHome: () => void;
};

type FirestoreStatus = 'checking' | 'connected' | 'disconnected';

export function Layout({ children, isHome, onHome }: LayoutProps) {
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreStatus>('checking');

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      checkFirestoreConnection()
        .then(() => {
          if (isMounted) setFirestoreStatus('connected');
        })
        .catch(() => {
          if (isMounted) setFirestoreStatus('disconnected');
        });
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const statusClass =
    firestoreStatus === 'connected'
      ? 'bg-emerald-500/70 shadow-[0_0_18px_rgba(16,185,129,0.5)]'
      : firestoreStatus === 'disconnected'
        ? 'bg-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
        : 'animate-pulse bg-slate-400/40 shadow-[0_0_14px_rgba(100,116,139,0.25)]';
  const geminiStatusClass = isGeminiConfigured()
    ? 'bg-sky-500/70 shadow-[0_0_18px_rgba(14,165,233,0.5)]'
    : 'bg-slate-400/35 shadow-[0_0_14px_rgba(100,116,139,0.25)]';

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="border-b-4 border-sky-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-sky-950">캐릭터 문단 배틀</div>
            <span
              aria-label="Firestore connection status"
              className={`mt-1 h-3 w-3 rounded-full opacity-70 blur-[0.2px] ${statusClass}`}
            />
            <span
              aria-label="Gemini API key status"
              className={`mt-1 h-3 w-3 rounded-full opacity-70 blur-[0.2px] ${geminiStatusClass}`}
            />
          </div>
          {!isHome && (
            <button
              className="rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white hover:bg-sky-800"
              onClick={onHome}
            >
              처음으로
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
