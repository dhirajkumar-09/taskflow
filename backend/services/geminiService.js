// Thin wrapper around Google's Gemini API (Gemini 3.6 Flash).
// Docs: https://ai.google.dev/gemini-api/docs

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Calls Gemini with a single text prompt.
 * @param {string} prompt - the prompt to send
 * @param {object} options
 * @param {boolean} options.json - if true, asks Gemini to return raw JSON
 * @param {number} options.temperature - creativity (0-1)
 * @returns {Promise<string>} the raw text returned by the model
 */
async function callGemini(prompt, { json = false, temperature = 0.4 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {})
    }
  };

  // Google's newer "Auth key" format (prefix "AQ.") is sent as a header
  // rather than a query param; the older "Standard key" format (prefix
  // "AIzaSy") works with either. Sending it as a header covers both.
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();

  // Gemini can refuse / block a response — surface that clearly instead of
  // silently returning an empty string.
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned no candidates (the prompt may have been blocked)');
  }

  const text = candidate.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text.trim()) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

/**
 * Calls Gemini expecting JSON back and parses it, with a clear error
 * if the model didn't return valid JSON.
 */
async function callGeminiJSON(prompt, options = {}) {
  const raw = await callGemini(prompt, { ...options, json: true });
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Sometimes models wrap JSON in ```json fences even when asked not to.
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

module.exports = { callGemini, callGeminiJSON };