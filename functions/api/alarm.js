// Cloudflare Pages Function: POST /api/alarm
// Keep all credentials in Cloudflare Pages > Settings > Variables and Secrets.
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

// Compare SHA-256 hashes to avoid early-exit string comparisons.
async function equalSecret(a, b) {
  const enc = new TextEncoder();
  const [ah, bh] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b))
  ]);
  const x = new Uint8Array(ah);
  const y = new Uint8Array(bh);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.ALARM_CODE || !env.NODE_RED_URL || !env.NODE_RED_TOKEN) {
    return json(503, { ok: false, error: 'Not configured' });
  }
  // Accept only requests initiated from this website.
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
  if (!(await equalSecret(body.code, String(env.ALARM_CODE)))) {
    return json(401, { ok: false });
  }

  // This webhook must be protected by the same shared token on the Node-RED side.
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
      body: JSON.stringify({ event: 'alarm', source: 'husbil.org' }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return json(502, { ok: false });
    return json(200, { ok: true });
  } catch {
    return json(502, { ok: false });
  }
}
