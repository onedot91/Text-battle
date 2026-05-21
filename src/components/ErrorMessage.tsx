export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-lg border-2 border-red-100 bg-red-50 p-5 text-lg font-bold text-red-700">{message}</div>;
}
