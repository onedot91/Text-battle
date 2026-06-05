const SUPABASE_QUOTA_ERROR_MESSAGE =
  'Supabase 무료 플랜 사용량을 초과해 데이터 요청이 막혔습니다. Supabase에서 플랜을 업그레이드하거나 다음 사용량 초기화 후 다시 시도해 주세요.';

export function isSupabaseQuotaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  if (maybeError.status === 402 || maybeError.statusCode === 402) return true;

  return [maybeError.code, maybeError.message, maybeError.details, maybeError.hint].some((value) => {
    const lowerValue = value?.toLowerCase() ?? '';
    return (
      lowerValue.includes('402') ||
      lowerValue.includes('quota') ||
      lowerValue.includes('egress') ||
      lowerValue.includes('restricted') ||
      lowerValue.includes('payment required')
    );
  });
}

export function getDataLoadErrorMessage(error: unknown) {
  return isSupabaseQuotaError(error) ? SUPABASE_QUOTA_ERROR_MESSAGE : '데이터를 불러오지 못했습니다.';
}
