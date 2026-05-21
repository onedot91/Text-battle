const geminiModel = 'gemini-2.5-flash';

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  return key && key !== 'your-gemini-api-key' ? key : '';
}

export default async function handler(request, response) {
  const apiKey = getGeminiApiKey();

  if (request.method === 'GET') {
    if (request.query?.test !== '1') {
      response.status(200).json({ configured: Boolean(apiKey) });
      return;
    }

    if (!apiKey) {
      response.status(200).json({ configured: false, reachable: false });
      return;
    }

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Return JSON only: {"ok":true}' }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0,
            },
          }),
        },
      );

      if (!geminiResponse.ok) {
        const responseText = await geminiResponse.text();
        let message = responseText;
        try {
          const parsed = JSON.parse(responseText);
          message = parsed?.error?.message || message;
        } catch {
          // Google can return plain text for some gateway errors.
        }
        response.status(200).json({ configured: true, reachable: false, error: message });
        return;
      }

      response.status(200).json({ configured: true, reachable: true });
    } catch (error) {
      response.status(200).json({
        configured: true,
        reachable: false,
        error: error instanceof Error ? error.message : 'Gemini request failed.',
      });
    }
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!apiKey) {
    response.status(500).json({ error: 'Gemini API key is missing.' });
    return;
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      },
    );

    const responseText = await geminiResponse.text();

    if (!geminiResponse.ok) {
      let message = responseText;
      try {
        const parsed = JSON.parse(responseText);
        message = parsed?.error?.message || message;
      } catch {
        // Google can return plain text for some gateway errors.
      }

      response.status(geminiResponse.status).json({ error: message });
      return;
    }

    response.setHeader('Content-Type', 'application/json');
    response.status(200).send(responseText);
  } catch (error) {
    response.status(502).json({
      error: error instanceof Error ? error.message : 'Gemini request failed.',
    });
  }
}
