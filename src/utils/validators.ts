const forbiddenWords = [
  '죽인다',
  '죽임',
  '없앤다',
  '폭파',
  '살인',
  '피',
  '칼',
  '총',
  '때린다',
  '공격해서 없애',
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

export function containsForbiddenWords(value: string) {
  const compactValue = normalizeForValidation(value);
  return forbiddenWords.some((word) => compactValue.includes(normalizeForValidation(word)));
}

export function containsUnfairPowerWords(value: string) {
  const compactValue = normalizeForValidation(value);
  return unfairPowerPhrases.some((phrase) => compactValue.includes(normalizeForValidation(phrase)));
}

export function validateStudentNumber(value: string | number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 23) {
    return '학생 번호는 1부터 23 사이 숫자만 사용할 수 있어요.';
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
  return '';
}
