const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const { GITHUB_TOKEN } = process.env;
  if (!GITHUB_TOKEN) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'GITHUB_TOKEN ausente' }) };
  }

  const r = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
  });
  const j = await r.json();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: r.ok, status: r.status, login: j.login, id: j.id, scopes: r.headers.get('x-oauth-scopes') })
  };
};
