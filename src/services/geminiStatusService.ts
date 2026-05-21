const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function isGeminiConfigured() {
  return Boolean(geminiApiKey) && geminiApiKey !== 'your-gemini-api-key';
}

export async function checkGeminiConfiguration() {
  if (!import.meta.env.PROD) {
    if (!isGeminiConfigured()) throw new Error('Gemini API key is missing.');
    return;
  }

  const response = await fetch('/api/gemini');
  if (!response.ok) throw new Error('Gemini status check failed.');

  const data = (await response.json()) as { configured?: boolean };
  if (!data.configured) throw new Error('Gemini API key is missing.');
}
