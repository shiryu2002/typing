const ALLOWED_ORIGINS = [
  'https://shiryu2002.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

function getCorsOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
    return origin;
  }
  return null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = getCorsOrigin(request);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!origin) return new Response('Forbidden', { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // POST のみ許可
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // オリジンチェック
    if (!origin) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const body = await request.json();

      const geminiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' +
        env.GEMINI_API_KEY;

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await geminiRes.json();

      return new Response(JSON.stringify(data), {
        status: geminiRes.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }
  },
};
