const headers = {
  'Access-Control-Allow-Origin': '*', // em prod restrinja ao seu domínio
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido.' }) };
  }

  try {
    const {
      GH_OWNER, GH_REPO, GH_BRANCH = 'main', GITHUB_TOKEN,
      SUPABASE_URL, SUPABASE_SERVICE_KEY,
      INDEX_PATH = 'index.html',
      RESULTS_PATH = 'resultados.html'
    } = process.env;

    if (!GH_OWNER || !GH_REPO || !GITHUB_TOKEN) {
      throw new Error('Env faltando: GH_OWNER, GH_REPO ou GITHUB_TOKEN');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Env faltando: SUPABASE_URL ou SUPABASE_SERVICE_KEY');
    }

    // auth opcional: checa se veio um accessToken do Supabase
    const { accessToken } = JSON.parse(event.body || '{}');
    if (!accessToken) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_SERVICE_KEY }
    });
    if (!u.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    // lê products do Supabase (server)
    const pr = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    if (!pr.ok) throw new Error('Falha ao ler products do Supabase');
    const products = await pr.json();

    // monta allProducts compatível
    const active = products
      .filter(p => p.ativo !== false)
      .sort((a,b)=>(a.ordem ?? 9999)-(b.ordem ?? 9999) || a.id-b.id)
      .map(p => ({
        id: p.id, tipo: p.tipo, perfis: p.perfis, logo: p.logo, tag: p.tag,
        tagClass: p.tagClass || undefined, titulo: p.titulo, vantagens: p.vantagens,
        link: p.link, btnPrimario: p.btnPrimario, btnSecundario: p.btnSecundario
      }));
    const newArrayJS = "const allProducts = " + JSON.stringify(active, null, 2) + ";";

    // helpers GitHub
    const ghHeaders = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' };
    const getFile = async (path) => {
      const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(GH_BRANCH)}`;
      const r = await fetch(url, { headers: ghHeaders });
      if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
      const j = await r.json();
      const content = Buffer.from(j.content.replace(/\n/g,''), 'base64').toString('utf8');
      return { sha: j.sha, content };
    };
    const replaceAllProducts = (txt) => {
      const idx = txt.indexOf('const allProducts');
      if (idx === -1) throw new Error('allProducts não encontrado');
      const eq = txt.indexOf('=', idx);
      const open = txt.indexOf('[', eq);
      if (eq === -1 || open === -1) throw new Error('início do array não encontrado');
      let i = open, depth = 0;
      for (; i < txt.length; i++) {
        const ch = txt[i];
        if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) {
            let end = i + 1;
            while (end < txt.length && /\s/.test(txt[end])) end++;
            if (txt[end] === ';') end++;
            return txt.slice(0, idx) + newArrayJS + txt.slice(end);
          }
        }
      }
      throw new Error('fim do array não encontrado');
    };
    const putFile = async (path, content, sha) => {
      const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
      const body = {
        message: `chore(admin): atualizar ofertas (allProducts)`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha, branch: GH_BRANCH
      };
      const r = await fetch(url, { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`PUT ${path}: ${r.status} ${await r.text()}`);
      return r.json();
    };

    // processa index e resultados
    const idx = await getFile(INDEX_PATH);
    const res = await getFile(RESULTS_PATH);
    const idxNew = replaceAllProducts(idx.content);
    const resNew = replaceAllProducts(res.content);
    await putFile(INDEX_PATH, idxNew, idx.sha);
    await putFile(RESULTS_PATH, resNew, res.sha);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: String(e) }) };
  }
};
