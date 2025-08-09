const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido.' }) };

  try {
    const {
      GH_OWNER, GH_REPO, GH_BRANCH = 'main', GITHUB_TOKEN,
      SUPABASE_URL, SUPABASE_SERVICE_KEY,
      INDEX_PATH = 'index.html',
      RESULTS_PATH = 'pages/resultados.html'
    } = process.env;

    if (!GH_OWNER || !GH_REPO || !GITHUB_TOKEN) throw new Error('Env faltando: GH_OWNER, GH_REPO ou GITHUB_TOKEN');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Env faltando: SUPABASE_URL ou SUPABASE_SERVICE_KEY');

    // valida accessToken de usuário
    let accessToken = null;
    try { const body = event.body ? JSON.parse(event.body) : {}; accessToken = body?.accessToken ? String(body.accessToken) : null; } catch {}
    if (!accessToken) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_SERVICE_KEY }
    });
    if (!u.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    // === lê do Supabase
    const fetchSB = async (path) => {
      const r = await fetch(`${SUPABASE_URL}${path}`, {
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
      });
      if (!r.ok) throw new Error(`Supabase ${path}: ${r.status} ${await r.text()}`);
      return r.json();
    };
    const products = await fetchSB('/rest/v1/products?select=*');
    const rules    = await fetchSB('/rest/v1/rules?select=*');

    const active = (products || [])
      .filter(p => p.ativo !== false)
      .sort((a, b) => (a.ordem ?? 9999) - (b.ordem ?? 9999) || a.id - b.id)
      .map(p => ({
        id: p.id, tipo: p.tipo, perfis: p.perfis, logo: p.logo, tag: p.tag, tagClass: p.tagClass || undefined,
        titulo: p.titulo, vantagens: p.vantagens, link: p.link, btnPrimario: p.btnPrimario, btnSecundario: p.btnSecundario
      }));
    const jsAllProducts = 'const allProducts = ' + JSON.stringify(active, null, 2) + ';';

    const PERFIS = ['negativado', 'aposentado', 'score-regular', 'bolsafamilia'];
    const prioByPerfil = {};
    for (const nome of PERFIS) {
      const r = (rules || []).find(x => x.nome === nome);
      prioByPerfil[nome] = Array.isArray(r?.priority_ids) ? r.priority_ids.filter(n => Number.isInteger(n)) : [];
    }
    const jsPrioMap = '\n// <<<PRIORITY_MAP_START>>>\nconst prioByPerfil = ' + JSON.stringify(prioByPerfil, null, 2) + ';\n// <<<PRIORITY_MAP_END>>>\n';

    // === GitHub helpers
    const ghHeaders = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' };
    const getFile = async (path) => {
      const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(GH_BRANCH)}`;
      const r = await fetch(url, { headers: ghHeaders });
      if (!r.ok) throw new Error(`GitHub GET ${path}: ${r.status} ${await r.text()}`);
      const j = await r.json();
      const content = Buffer.from((j.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
      return { sha: j.sha, content };
    };
    const putFile = async (path, content, sha) => {
      const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(path)}`;
      const body = { message: 'chore(admin): atualizar ofertas/prioridades', content: Buffer.from(content, 'utf8').toString('base64'), sha, branch: GH_BRANCH };
      const r = await fetch(url, { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`GitHub PUT ${path}: ${r.status} ${await r.text()}`);
      const jr = await r.json();
      return { sha: jr.commit?.sha || jr.sha || null };
    };

    const replaceAllProducts = (txt) => {
      const idx = txt.indexOf('const allProducts');
      if (idx === -1) return null;
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
            return txt.slice(0, idx) + jsAllProducts + txt.slice(end);
          }
        }
      }
      throw new Error('Fim do array allProducts não encontrado.');
    };

    const ensureAllProductsScript = (txt) => {
      if (txt.includes('const allProducts')) return txt;
      const tag = `<script id="allProducts-data">\n${jsAllProducts}\n</script>`;
      const idx = txt.lastIndexOf('</body>');
      if (idx !== -1) return txt.slice(0, idx) + '\n' + tag + '\n' + txt.slice(idx);
      return txt + '\n' + tag + '\n';
    };

    const upsertPrioMap = (txt) => {
      const start = txt.indexOf('// <<<PRIORITY_MAP_START>>>');
      const end   = txt.indexOf('// <<<PRIORITY_MAP_END>>>');
      if (start !== -1 && end !== -1 && end > start) {
        return txt.slice(0, start) + jsPrioMap + txt.slice(end + '// <<<PRIORITY_MAP_END>>>'.length);
      }
      const scriptEnd = txt.lastIndexOf('</script>');
      if (scriptEnd !== -1) return txt.slice(0, scriptEnd) + '\n' + jsPrioMap + txt.slice(scriptEnd);
      const bodyEnd = txt.lastIndexOf('</body>');
      if (bodyEnd !== -1) return txt.slice(0, bodyEnd) + '\n' + jsPrioMap + txt.slice(bodyEnd);
      return txt + '\n' + jsPrioMap + '\n';
    };

    const targets = [
      { path: INDEX_PATH,   prio: false },
      { path: RESULTS_PATH, prio: true  }
    ];

    let commits = [];
    let changed = false;

    for (const t of targets) {
      try {
        const file = await getFile(t.path);
        let next  = replaceAllProducts(file.content);
        if (next === null) next = ensureAllProductsScript(file.content);
        if (t.prio) next = upsertPrioMap(next);

        if (next !== file.content) {
          changed = true;
          const res = await putFile(t.path, next, file.sha);
          if (res.sha) commits.push(res.sha);
        }
      } catch (err) {

        console.warn(`[publish] Falha ao processar ${t.path}:`, err.message);
      }
    }

    if (!changed) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, note: 'Nenhum arquivo atualizado.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, commits, commit_sha: commits[0] || null }) };
  } catch (e) {
    console.error('[publish] erro:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }
};
