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
// Status codes worth retrying: 503 (overloaded/unavailable) and 429 (rate
// limited) are transient; everything else (400, 401, 403, 404...) is not
// going to fix itself on retry.
const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response;
    try {
      // Google's newer "Auth key" format (prefix "AQ.") is sent as a header
      // rather than a query param; the older "Standard key" format (prefix
      // "AIzaSy") works with either. Sending it as a header covers both.
      response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      });
    } catch (networkErr) {
      // Network-level failure (DNS, timeout, connection reset) — also worth
      // retrying a couple of times.
      lastError = new Error(`Gemini request failed: ${networkErr.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      throw lastError;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      lastError = new Error(`Gemini API error (${response.status}): ${errText || response.statusText}`);

      if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        // Exponential backoff: ~0.8s, 1.6s, 3.2s (plus a little jitter).
        const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 250;
        await sleep(delay);
        continue;
      }

      throw lastError;
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

  // Should be unreachable, but just in case.
  throw lastError || new Error('Gemini API call failed after retries');
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