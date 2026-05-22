import { useEffect, useState, type ReactNode } from 'react';
import { checkSupabaseConnection } from '../services/supabaseStatusService';
import { checkGeminiConfiguration } from '../services/geminiStatusService';

type LayoutProps = {
  children: ReactNode;
  title?: ReactNode;
  headerAction?: ReactNode;
  isHome: boolean;
  showTeacherButton: boolean;
  onHome: () => void;
  onTeacher: () => void;
};

type SupabaseStatus = 'checking' | 'connected' | 'disconnected';
type GeminiStatus = 'checking' | 'configured' | 'missing';

export function Layout({
  children,
  title = '캐릭터 문단 배틀',
  headerAction,
  isHome,
  showTeacherButton,
  onHome,
  onTeacher,
}: LayoutProps) {
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>('checking');
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus>('checking');

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      checkSupabaseConnection()
        .then(() => {
          if (isMounted) setSupabaseStatus('connected');
        })
        .catch(() => {
          if (isMounted) setSupabaseStatus('disconnected');
        });

      checkGeminiConfiguration()
        .then(() => {
          if (isMounted) setGeminiStatus('configured');
        })
        .catch(() => {
          if (isMounted) setGeminiStatus('missing');
        });
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const statusClass =
    supabaseStatus === 'connected'
      ? 'bg-emerald-500/70 shadow-[0_0_18px_rgba(16,185,129,0.5)]'
      : supabaseStatus === 'disconnected'
        ? 'bg-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
        : 'animate-pulse bg-slate-400/40 shadow-[0_0_14px_rgba(100,116,139,0.25)]';
  const geminiStatusClass =
    geminiStatus === 'configured'
      ? 'bg-sky-500/70 shadow-[0_0_18px_rgba(14,165,233,0.5)]'
      : geminiStatus === 'missing'
        ? 'bg-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
        : 'animate-pulse bg-slate-400/40 shadow-[0_0_14px_rgba(100,116,139,0.25)]';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-slate-950">{title}</div>
            <span
              aria-label="Supabase connection status"
              className={`mt-1 h-3 w-3 rounded-full opacity-70 blur-[0.2px] ${statusClass}`}
            />
            <span
              aria-label="Gemini API key status"
              className={`mt-1 h-3 w-3 rounded-full opacity-70 blur-[0.2px] ${geminiStatusClass}`}
            />
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
            {isHome && showTeacherButton && (
              <button
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={onTeacher}
              >
                교사용 관리
              </button>
            )}
            {!isHome && (
            <button
              className="rounded-lg bg-sky-700 px-6 py-4 text-xl font-black text-white hover:bg-sky-800"
              onClick={onHome}
            >
              처음으로
            </button>
            )}
          </div>
        </div>
      </header>
      <main className={`mx-auto max-w-7xl px-6 py-8 ${isHome ? 'home-main' : ''}`}>{children}</main>
    </div>
  );
}
