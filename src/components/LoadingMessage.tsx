export function LoadingMessage({ message = '기다려 주세요.' }: { message?: string }) {
  return <div className="rounded-lg border-2 border-blue-100 bg-blue-50 p-5 text-lg font-bold text-blue-800">{message}</div>;
}
