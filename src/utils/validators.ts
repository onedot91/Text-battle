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

export function containsForbiddenWords(value: string) {
  const compactValue = value.replace(/\s+/g, '').toLowerCase();
  return forbiddenWords.some((word) => compactValue.includes(word.replace(/\s+/g, '').toLowerCase()));
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
