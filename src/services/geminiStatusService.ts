const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function isGeminiConfigured() {
  return Boolean(geminiApiKey) && geminiApiKey !== 'your-gemini-api-key';
}
