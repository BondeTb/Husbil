// Cloudflare Pages Function: POST /api/alarm
// Personliga koder kontrolleras i Node-RED, INTE här.
// NODE_RED_TOKEN och NODE_RED_URL sätts i Cloudflare Pages Secrets/Variables.
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.NODE_RED_URL || !env.NODE_RED_TOKEN) {
    return json(503, { ok: false, error: 'Not configured' });
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json(403, { ok: false });
  }
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false });
  }
  if (Number(request.headers.get('Content-Length') || 0) > 1024) {
    return json(413, { ok: false });
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 1024) return json(413, { ok: false });
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false });
  }
  if (typeof body?.code !== 'string' || body.code.length < 1 || body.code.length > 128) {
    return json(400, { ok: false });
  }

  let endpoint;
  try {
    endpoint = new URL(env.NODE_RED_URL);
    if (endpoint.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    return json(503, { ok: false, error: 'Not configured' });
  }

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Alarm-Token': env.NODE_RED_TOKEN
      },
      body: JSON.stringify({ code: body.code }),
      signal: AbortSignal.timeout(8000)
    });

    if (response.status === 401) return json(401, { ok: false });
    if (response.status === 429) return json(429, { ok: false });
    if (!response.ok) return json(502, { ok: false });

    let data;
    try { data = await response.json(); } catch { return json(502, { ok: false }); }
    if (data?.ok !== true) return json(502, { ok: false });
    return json(200, {
      ok: true,
      person: typeof data.person === 'string' ? data.person.slice(0, 80) : null
    });
  } catch {
    return json(502, { ok: false });
  }
}
