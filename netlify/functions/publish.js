const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao seu domínio
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
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

    // —— checagem de envs (tudo via Netlify, nada hardcoded) ——
    if (!GH_OWNER || !GH_REPO || !GITHUB_TOKEN) {
      throw new Error('Env faltando: GH_OWNER, GH_REPO ou GITHUB_TOKEN');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Env faltando: SUPABASE_URL ou SUPABASE_SERVICE_KEY');
    }

    // —— auth do Supabase via accessToken (usuário logado no admin) ——
    let accessToken = null;
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      accessToken = body?.accessToken ? String(body.accessToken) : null;
    } catch {}
    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_SERVICE_KEY }
    });
    if (!u.ok) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // —— lê products com service role (ignora RLS) ——
    const pr = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    if (!pr.ok) throw new Error(`Falha ao ler products do Supabase: ${pr.status} ${await pr.text()}`);
    const products = await pr.json();

    // —— monta arrays SEPARADOS (Index x Resultados) ——
    const mapFront = (p) => ({
      id: p.id,
      tipo: p.tipo,
      perfis: p.perfis,
      logo: p.logo,
      tag: p.tag,
      tagClass: p.tagClass || undefined,
      titulo: p.titulo,
      vantagens: p.vantagens,
      link: p.link,
      btnPrimario: p.btnPrimario,
      btnSecundario: p.btnSecundario
    });

    const arrayFor = (page) => {
      const flag = page === 'index' ? 'show_in_index' : 'show_in_resultados';
      const ord  = page === 'index' ? 'ordem_index'   : 'ordem_resultados';
      return (products || [])
        .filter(p => p.ativo !== false && p[flag] !== false)
        .sort((a, b) => (a[ord] ?? 9999) - (b[ord] ?? 9999) || (a.id - b.id))
        .map(mapFront);
    };

    const jsIndex    = 'const allProducts = ' + JSON.stringify(arrayFor('index'),    null, 2) + ';';
    const jsResults  = 'const allProducts = ' + JSON.stringify(arrayFor('results'),  null, 2) + ';';

    // —— helpers GitHub ——
    const ghHeaders = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' };

    const getFile = async (path) => {
      const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(GH_BRANCH)}`;
      const r = await fetch(url, { headers: ghHeaders });
      if (!r.ok) throw new Error(`GitHub GET ${path}: ${r.status} ${await r.text()}`);
      const j = await r.json();
      const content = Buffer.from((j.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
      return { sha: j.sha, content };
    };

    const replaceAllProducts = (txt, newJs) => {
      const idx = txt.indexOf('const allProducts');
      if (idx === -1) return null; // não quebra se não achar
      const eq = txt.indexOf('=', idx);
      const open = txt.indexOf('[', eq);
      if (eq === -1 || open === -1) throw new Error('Início do array allProducts não encontrado.');

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
            return txt.slice(0, idx) + newJs + txt.slice(end);
          }
        }
      }
      throw new Error('Fim do array allProducts não encontrado.');
    };

    const putFile = async (path, content, sha) => {
      const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
      const body = {
        message: `chore(admin): atualizar ofertas (allProducts -> ${path})`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha,
        branch: GH_BRANCH
      };
      const r = await fetch(url, { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`GitHub PUT ${path}: ${r.status} ${await r.text()}`);
      return r.json();
    };

    
    const targets = [
      { path: INDEX_PATH,    js: jsIndex },
      { path: RESULTS_PATH,  js: jsResults }
    ];

    let commits = 0;
    for (const t of targets) {
      try {
        const file = await getFile(t.path);
        const replaced = replaceAllProducts(file.content, t.js);
        if (replaced === null) {

          console.log(`[publish] ${t.path} não contém "const allProducts". Pulando.`);
          continue;
        }
        if (replaced !== file.content) {
          await putFile(t.path, replaced, file.sha);
          commits++;
        } else {
          console.log(`[publish] ${t.path} já estava atualizado.`);
        }
      } catch (err) {

        console.warn(`[publish] Falha ao processar ${t.path}:`, err.message);
      }
    }


    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, commits }) };
  } catch (e) {
    console.error('[publish] erro:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }
};
