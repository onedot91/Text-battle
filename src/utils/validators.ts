const forbiddenPatterns = [
  /죽인/,
  /죽임/,
  /죽여/,
  /죽일/,
  /살인/,
  /폭파/,
  /때린/,
  /때려/,
  /때릴/,
  /공격해서없애/,
  /(상대|상대방|친구|사람|남|적).{0,4}(없애|없앤|없앨)/,
  /(없애|없앤|없앨).{0,4}(상대|상대방|친구|사람|남|적)/,
  /칼로.{0,4}(찌르|찌른|찌를|베|벤|벨|공격|상처|위협)/,
  /총(으로)?.{0,4}(쏘|쏜|쏠|공격|위협)/,
  /피(를)?(흘|나|투성이|범벅)/,
];

export const unfairPowerPhrases = [
  '무조건 이긴',
  '무조건 이김',
  '무조건 승리',
  '항상 이긴',
  '항상 이김',
  '항상 승리',
  '절대 지지',
  '절대 안 지',
  '절대 이긴',
  '이길 수밖에',
  '이길 수 있다',
  '이길수있다',
  '승리 확정',
  '필승',
  '무패',
  '무적',
  '전능',
  '최강',
  '상대가 못',
  '상대를 못',
  '상대방을 이길',
  '상대방이 못',
  '상상을 실현',
  '상상을 현실',
  '상상으로',
  '상상한 대로',
  '상상한대로',
  '현실로 만든',
  '현실로 바꾼',
  '원하는 대로',
  '원하는대로',
  '뭐든지',
  '무엇이든',
  '모든 것을',
  '모든걸',
  '어떤 상황',
  '모든 상황',
];

function normalizeForValidation(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function getHangulSyllableCount(value: string) {
  return (value.match(/[가-힣]/g) || []).length;
}

function getAsciiLetterOrDigitCount(value: string) {
  return (value.match(/[a-z0-9]/gi) || []).length;
}

function getStandaloneJamoCount(value: string) {
  return (value.match(/[ㄱ-ㅎㅏ-ㅣ]/g) || []).length;
}

function getSymbolCount(value: string) {
  return (value.match(/[^\p{L}\p{N}\s]/gu) || []).length;
}

function hasTooManyLatinFragments(value: string) {
  const compactValue = normalizeForValidation(value);
  const asciiCount = getAsciiLetterOrDigitCount(compactValue);
  if (asciiCount < 3) return false;

  const hangulCount = getHangulSyllableCount(compactValue);
  return hangulCount === 0 || asciiCount > hangulCount;
}

function hasUnusableTextShape(value: string) {
  const compactValue = normalizeForValidation(value);
  if (!compactValue) return false;
  if (getHangulSyllableCount(compactValue) === 0) return true;
  if (getStandaloneJamoCount(compactValue) > 0) return true;
  if (hasTooManyLatinFragments(compactValue)) return true;

  const symbolCount = getSymbolCount(compactValue);
  return symbolCount > 0 && symbolCount >= Math.ceil(compactValue.length * 0.15);
}

export function containsForbiddenWords(value: string) {
  const compactValue = normalizeForValidation(value);
  return forbiddenPatterns.some((pattern) => pattern.test(compactValue));
}

export function containsUnfairPowerWords(value: string) {
  const compactValue = normalizeForValidation(value);
  return unfairPowerPhrases.some((phrase) => compactValue.includes(normalizeForValidation(phrase)));
}

export function validateStudentNumber(value: string | number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 23) {
    return '학생 번호는 0부터 23 사이 숫자만 사용할 수 있어요.';
  }
  return '';
}

export function validateCharacterName(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 7) {
    return '캐릭터 이름은 2자부터 7자까지 쓸 수 있어요.';
  }
  if (containsForbiddenWords(trimmed)) {
    return '다른 친구를 다치게 하는 표현은 사용할 수 없어요.';
  }
  if (hasUnusableTextShape(trimmed)) {
    return '캐릭터 이름은 알아볼 수 있는 말로 써 주세요.';
  }
  return '';
}

export function validateBlankText(value: string, maxLength = 30, fieldLabel = '빈칸') {
  const trimmed = value.trim();
  if (!trimmed) {
    return '빈칸 내용을 써 주세요.';
  }
  if (trimmed.length > maxLength) {
    return `${fieldLabel}은 ${maxLength}자 이내로 써 주세요.`;
  }
  if (containsForbiddenWords(trimmed)) {
    return '다른 친구를 다치게 하는 표현은 사용할 수 없어요.';
  }
  if (hasUnusableTextShape(trimmed)) {
    return `${fieldLabel}은 말이 되도록 다시 써 주세요.`;
  }
  return '';
}
