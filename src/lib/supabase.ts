import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'your-supabase-url' &&
  supabaseAnonKey !== 'your-supabase-anon-key';

if (!isSupabaseConfigured) {
  console.error(
    'Supabase 설정을 확인해 주세요. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 필요합니다.',
  );
}

// 실제 장기 운영 시에는 교사용 관리자 인증, 학급 코드, 학생별 수정 제한 정책을 추가해야 합니다.
export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
);
