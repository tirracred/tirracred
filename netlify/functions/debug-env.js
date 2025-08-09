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

  const has = (k) => Boolean(process.env[k]);
  const out = {
    GH_OWNER: has('GH_OWNER'),
    GH_REPO: has('GH_REPO'),
    GH_BRANCH: has('GH_BRANCH'),
    GITHUB_TOKEN: has('GITHUB_TOKEN'),
    SUPABASE_URL: has('SUPABASE_URL'),
    SUPABASE_ANON_KEY: has('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_KEY: has('SUPABASE_SERVICE_KEY')
  };

  return { statusCode: 200, headers, body: JSON.stringify(out) };
};
