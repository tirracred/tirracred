// Arquivo: worker.js (colocar na RAIZ do repositório GitHub, junto ao index.html e wrangler.toml)

const FALLBACK_URL = 'https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=app&utm_campaign=ds_banner';

const DEFAULT_OFFER = {
  maxValue: 300.0,
  fee: 72.9,
  baseFee: 9.9,
  type: 'SalaryAdvance',
  description: 'Até R$ 300, oferta personalizada após análise.'
};

const FACIO_TIMEOUT_MS = 15000;

const CORS_JSON_HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const DEFAULT_SUPABASE_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';

function isValidCPF(cpf) {
  const clean = String(cpf || '').replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rem = sum % 11;
  const v1 = rem < 2 ? 0 : 11 - rem;
  if (v1 !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rem = sum % 11;
  const v2 = rem < 2 ? 0 : 11 - rem;
  return v2 === parseInt(clean.charAt(10), 10);
}

function validateAndFormatLeadPayload(body) {
  const errors = [];

  const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
  if (!isValidCPF(cleanCpf)) {
    errors.push('personalInfo.cpf must have 11 valid digits');
  }

  const cleanName = String(body.nome || '').replace(/\s+/g, ' ').trim();
  if (cleanName.length < 5 || !cleanName.includes(' ')) {
    errors.push('personalInfo.name must include first and last name');
  }

  let cleanPhone = String(body.whatsapp || '').replace(/\D/g, '');
  if ((cleanPhone.length === 12 || cleanPhone.length === 13) && cleanPhone.startsWith('55')) {
    cleanPhone = cleanPhone.slice(2);
  }
  if (!/^[1-9]{2}9\d{8}$/.test(cleanPhone)) {
    errors.push('contactInfo.phone must be a valid Brazilian mobile phone with DDD (XX9XXXXXXXX)');
  }

  const cleanEmail = String(body.email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.push('contactInfo.email must be a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanCpf,
    payload: {
      personalInfo: {
        name: cleanName,
        cpf: cleanCpf
      },
      contactInfo: {
        email: cleanEmail,
        phone: cleanPhone
      },
      campaign: String(body.campaign || 'ds_banner').trim()
    }
  };
}

async function callFacioAPI(baseUrl, endpoint, payload, authHeader, facioEnv, retries = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACIO_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data = null;
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = { rawBody: rawText };
      }
    }

    if (!response.ok) {
      console.error(
        `[FACIO_API_ERROR] env=${facioEnv} endpoint=${endpoint} status=${response.status} body=${rawText || '<empty>'}`
      );
    }

    if (response.status >= 500 && retries > 0) {
      console.warn(`[FACIO_API_RETRY] Retrying ${endpoint} after HTTP ${response.status}...`);
      return callFacioAPI(baseUrl, endpoint, payload, authHeader, facioEnv, retries - 1);
    }

    return {
      status: response.status,
      data,
      rawText,
      isServerOrNetworkError: response.status >= 500
    };
  } catch (networkErr) {
    clearTimeout(timeoutId);
    const isAbort = networkErr && networkErr.name === 'AbortError';
    console.error(
      `[FACIO_NETWORK_ERROR] env=${facioEnv} endpoint=${endpoint} type=${isAbort ? 'TIMEOUT' : 'FETCH_ERROR'} message=${networkErr?.message || networkErr}`
    );

    if (retries > 0) {
      return callFacioAPI(baseUrl, endpoint, payload, authHeader, facioEnv, retries - 1);
    }

    return {
      status: 503,
      data: { error: isAbort ? 'Facio API request timed out' : 'Facio API network failure' },
      rawText: String(networkErr?.message || networkErr),
      isServerOrNetworkError: true
    };
  }
}

async function handleFacioLeadgen(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_JSON_HEADERS });
  }

  const rawEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();
  const facioEnv = rawEnv === 'sandbox' ? 'sandbox' : 'production';
  const facioUser = env?.FACIO_API_USER ? String(env.FACIO_API_USER).trim() : '';
  const facioPass = env?.FACIO_API_PASSWORD ? String(env.FACIO_API_PASSWORD).trim() : '';

  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      ok: true,
      service: 'tirracred-facio-leadgen',
      environment: facioEnv,
      credentialsConfigured: Boolean(facioUser && facioPass)
    }), {
      status: 200,
      headers: CORS_JSON_HEADERS
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_JSON_HEADERS
    });
  }

  let action = null;
  try {
    const body = await request.json();
    action = body?.action;

    const baseUrl = facioEnv === 'sandbox'
      ? 'https://api.facio.dev/leadgen'
      : 'https://api.facio.com/leadgen';

    if (!facioUser || !facioPass) {
      console.error(`[FACIO_CONFIG_ERROR] Missing FACIO_API_USER or FACIO_API_PASSWORD in (${facioEnv}).`);
      return new Response(JSON.stringify({
        error: 'missing_credentials',
        message: 'Credenciais da API Facio não configuradas no ambiente.',
        isAvailable: false
      }), {
        status: 500,
        headers: CORS_JSON_HEADERS
      });
    }

    const authHeader = 'Basic ' + btoa(`${facioUser}:${facioPass}`);

    if (action === 'availability') {
      const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
      if (!isValidCPF(cleanCpf)) {
        return new Response(JSON.stringify({
          isAvailable: false,
          validationError: true,
          errors: ['cpf is not valid']
        }), {
          status: 400,
          headers: CORS_JSON_HEADERS
        });
      }

      const result = await callFacioAPI(baseUrl, '/availability', { cpf: cleanCpf }, authHeader, facioEnv);

      if (result.isServerOrNetworkError) {
        return new Response(JSON.stringify({
          isAvailable: true,
          fallbackMode: true,
          offer: DEFAULT_OFFER,
          requestId: 'fallback-availability-upstream-error'
        }), {
          status: 200,
          headers: CORS_JSON_HEADERS
        });
      }

      if (result.status === 409) {
        return new Response(JSON.stringify({
          isAvailable: false,
          alreadyRegistered: true,
          error: 'user already registered',
          details: result.data
        }), {
          status: 409,
          headers: CORS_JSON_HEADERS
        });
      }

      const isAvailable = Boolean(result.data?.isAvailable);
      return new Response(JSON.stringify({
        ...(result.data || {}),
        isAvailable,
        offer: result.data?.offer || (isAvailable ? DEFAULT_OFFER : null),
        alreadyRegistered: false
      }), {
        status: result.status,
        headers: CORS_JSON_HEADERS
      });
    }

    if (action === 'lead') {
      const validation = validateAndFormatLeadPayload(body);

      if (!validation.isValid) {
        return new Response(JSON.stringify({
          error: 'invalid_payload',
          validationError: true,
          errors: validation.errors
        }), {
          status: 400,
          headers: CORS_JSON_HEADERS
        });
      }

      const result = await callFacioAPI(baseUrl, '/lead', validation.payload, authHeader, facioEnv);

      if ((result.status === 200 || result.status === 201) && result.data?.registrationUrl) {
        return new Response(JSON.stringify({
          ...result.data,
          alreadyRegistered: false,
          fallbackMode: false
        }), {
          status: 200,
          headers: CORS_JSON_HEADERS
        });
      }

      if (result.status === 409) {
        return new Response(JSON.stringify({
          alreadyRegistered: true,
          isAvailable: false,
          error: 'user already registered',
          details: result.data
        }), {
          status: 409,
          headers: CORS_JSON_HEADERS
        });
      }

      if (result.isServerOrNetworkError) {
        return new Response(JSON.stringify({
          registrationUrl: FALLBACK_URL,
          fallbackUrl: FALLBACK_URL,
          offer: DEFAULT_OFFER,
          fallbackMode: true,
          upstreamStatus: result.status
        }), {
          status: 200,
          headers: CORS_JSON_HEADERS
        });
      }

      return new Response(JSON.stringify({
        error: 'facio_api_rejected',
        validationError: result.status === 400 || result.status === 422,
        alreadyRegistered: false,
        details: result.data
      }), {
        status: result.status,
        headers: CORS_JSON_HEADERS
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: CORS_JSON_HEADERS
    });
  } catch (err) {
    console.error(`[FACIO_UNHANDLED_EXCEPTION] action=${action} error=${err?.stack || err?.message || err}`);
    return new Response(JSON.stringify({
      error: 'internal_server_error',
      message: 'Erro interno ao processar requisição para a Facio.'
    }), {
      status: 500,
      headers: CORS_JSON_HEADERS
    });
  }
}

async function handleFacioWebhook(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_JSON_HEADERS });
  }

  const facioEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();

  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      ok: true,
      service: 'tirracred-facio-webhook',
      environment: facioEnv
    }), {
      status: 200,
      headers: CORS_JSON_HEADERS
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_JSON_HEADERS
    });
  }

  try {
    if (env?.FACIO_WEBHOOK_SECRET) {
      const incomingToken =
        request.headers.get('authorization') ||
        request.headers.get('x-facio-signature') ||
        request.headers.get('x-webhook-secret');

      const expectedSecret = String(env.FACIO_WEBHOOK_SECRET).trim();
      if (!incomingToken || !incomingToken.includes(expectedSecret)) {
        return new Response(JSON.stringify({ error: 'Unauthorized webhook token' }), {
          status: 401,
          headers: CORS_JSON_HEADERS
        });
      }
    }

    const rawBody = await request.text();
    if (!rawBody) {
      return new Response(JSON.stringify({ error: 'Empty payload' }), {
        status: 400,
        headers: CORS_JSON_HEADERS
      });
    }

    let eventData;
    try {
      eventData = JSON.parse(rawBody);
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: CORS_JSON_HEADERS
      });
    }

    const eventType =
      eventData?.event ||
      eventData?.type ||
      eventData?.status ||
      eventData?.eventType ||
      'unknown_event';

    const partnerCustomerId =
      eventData?.partnerCustomerId ||
      eventData?.leadId ||
      eventData?.id ||
      eventData?.requestId ||
      eventData?.data?.partnerCustomerId ||
      null;

    const campaign = eventData?.campaign || 'link';
    const eventDate = eventData?.eventDate || new Date().toISOString();

    console.log(
      `[FACIO_WEBHOOK_EVENT] env=${facioEnv} event=${eventType} partnerCustomerId=${partnerCustomerId || 'N/A'} campaign=${campaign} eventDate=${eventDate}`
    );

    if (env?.DB) {
      try {
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS facio_webhook_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            env TEXT,
            event_type TEXT,
            lead_id TEXT,
            cpf TEXT,
            payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        ).run();

        await env.DB.prepare(
          `INSERT INTO facio_webhook_logs (env, event_type, lead_id, cpf, payload) VALUES (?, ?, ?, ?, ?)`
        )
          .bind(
            facioEnv,
            String(eventType),
            partnerCustomerId ? String(partnerCustomerId) : null,
            campaign,
            JSON.stringify(eventData)
          )
          .run();
      } catch (dbErr) {
        console.warn(`[FACIO_WEBHOOK_D1_SKIP] message=${dbErr?.message || dbErr}`);
      }
    }

    return new Response(JSON.stringify({
      received: true,
      environment: facioEnv,
      event: eventType,
      partnerCustomerId,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: CORS_JSON_HEADERS
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal webhook processing error' }), {
      status: 500,
      headers: CORS_JSON_HEADERS
    });
  }
}


// =========================================================================
// CAPTURA, LISTAGEM E EXCLUSÃO DE LEADS (CLOUDFLARE D1 "tirracred" + SUPABASE)
// =========================================================================
function getD1Database(env) {
  if (!env) return null;
  if (env.DB && typeof env.DB.prepare === 'function') return env.DB;
  if (env.tirracred && typeof env.tirracred.prepare === 'function') return env.tirracred;
  if (env.TIRRACRED_DB && typeof env.TIRRACRED_DB.prepare === 'function') return env.TIRRACRED_DB;
  if (env.DATABASE && typeof env.DATABASE.prepare === 'function') return env.DATABASE;

  for (const val of Object.values(env)) {
    if (val && typeof val === 'object' && typeof val.prepare === 'function') {
      return val;
    }
  }
  return null;
}

function toLeadBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'on' || normalized === '1' || normalized === 'sim';
}

function toLeadNumberOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const num = Number(String(value).replace(',', '.'));
  return Number.isNaN(num) ? null : num;
}

function onlyLeadDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits || null;
}

async function ensureLeadsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT,
      cpf TEXT NOT NULL,
      whatsapp TEXT,
      renda_mensal TEXT DEFAULT '0',
      valor_desejado TEXT,
      negativado BOOLEAN DEFAULT 0,
      parcelas INTEGER DEFAULT 1,
      aposentado BOOLEAN DEFAULT 0,
      bolsafamilia BOOLEAN DEFAULT 0,
      facio_elegivel BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
}

async function saveLeadToD1(db, lead) {
  if (!db) {
    throw new Error('Binding D1 (DB) não vinculado ao Worker tirracred. No painel da Cloudflare: Workers & Pages > tirracred > Settings > Bindings > Add D1 Database (Variable name: DB, Database: tirracred).');
  }

  await ensureLeadsTable(db);

  const result = await db.prepare(`
    INSERT INTO leads (
      nome, email, cpf, whatsapp, renda_mensal, valor_desejado,
      negativado, parcelas, aposentado, bolsafamilia, facio_elegivel, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    lead.nome,
    lead.email,
    lead.cpf || '',
    lead.whatsapp,
    lead.renda_mensal !== null ? String(lead.renda_mensal) : '0',
    lead.valor_desejado !== null ? String(lead.valor_desejado) : '300',
    lead.negativado ? 1 : 0,
    lead.parcelas ?? 1,
    lead.aposentado ? 1 : 0,
    lead.bolsafamilia ? 1 : 0,
    lead.facio_elegivel ? 1 : 0,
    lead.created_at
  ).run();

  return { id: result?.meta?.last_row_id || null };
}

async function saveLeadToSupabase(env, lead) {
  const supaUrl = env?.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supaKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  const fullRow = {
    nome: lead.nome,
    email: lead.email,
    ...(lead.cpf ? { cpf: lead.cpf } : {}),
    ...(lead.whatsapp ? { whatsapp: lead.whatsapp } : {}),
    ...(lead.renda_mensal !== null ? { renda_mensal: String(lead.renda_mensal) } : {}),
    ...(lead.valor_desejado !== null ? { valor_desejado: String(lead.valor_desejado) } : {}),
    negativado: lead.negativado,
    aposentado: lead.aposentado,
    bolsafamilia: lead.bolsafamilia,
    ...(lead.parcelas !== null ? { parcelas: lead.parcelas } : {}),
    created_at: lead.created_at
  };

  const insertSupabase = (bodyObj) => fetch(`${supaUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': supaKey,
      'Authorization': `Bearer ${supaKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(bodyObj)
  });

  let res = await insertSupabase(fullRow);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (errText.includes('created_at')) {
      const { created_at, ...legacyRow } = fullRow;
      res = await insertSupabase(legacyRow);
      if (!res.ok) {
        const retryErr = await res.text().catch(() => '');
        throw new Error(`Supabase (${res.status}): ${retryErr}`);
      }
      return { ok: true, usedLegacySchema: true };
    }
    throw new Error(`Supabase (${res.status}): ${errText}`);
  }

  return { ok: true, usedLegacySchema: false };
}

async function handleLeadsAPI(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_JSON_HEADERS });
  }

  const db = getD1Database(env);
  const url = new URL(request.url);

  // GET /api/leads -> Lista leads salvos no Cloudflare D1
  if (request.method === 'GET') {
    if (!db) {
      return new Response(JSON.stringify({
        error: 'Binding D1 (DB) não vinculado ao Worker tirracred. Vá em Cloudflare > Workers & Pages > tirracred > Settings > Bindings > Add D1 Database (Variable name: DB, Database: tirracred).'
      }), {
        status: 500,
        headers: CORS_JSON_HEADERS
      });
    }

    try {
      await ensureLeadsTable(db);
      const { results } = await db.prepare(
        'SELECT * FROM leads ORDER BY id DESC LIMIT 1000'
      ).all();

      return new Response(JSON.stringify(results || []), {
        status: 200,
        headers: CORS_JSON_HEADERS
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: `Erro ao listar leads no D1: ${error.message}` }), {
        status: 500,
        headers: CORS_JSON_HEADERS
      });
    }
  }

  // DELETE /api/leads?id=123 -> Exclui lead do Cloudflare D1
  if (request.method === 'DELETE') {
    if (!db) {
      return new Response(JSON.stringify({ error: 'Binding D1 (DB) não configurado no Worker.' }), {
        status: 500,
        headers: CORS_JSON_HEADERS
      });
    }

    try {
      let id = url.searchParams.get('id');
      if (!id) {
        const body = await request.json().catch(() => ({}));
        id = body?.id;
      }
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID do lead não informado.' }), {
          status: 400,
          headers: CORS_JSON_HEADERS
        });
      }

      await db.prepare('DELETE FROM leads WHERE id = ?').bind(Number(id)).run();
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: CORS_JSON_HEADERS
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: `Erro ao excluir lead no D1: ${error.message}` }), {
        status: 500,
        headers: CORS_JSON_HEADERS
      });
    }
  }

  // POST /api/leads -> Salva lead simultaneamente no Cloudflare D1 + Supabase com data/hora automática
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: CORS_JSON_HEADERS
    });
  }

  try {
    const data = await request.json().catch(() => null);
    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'Corpo JSON inválido.' }), {
        status: 400,
        headers: CORS_JSON_HEADERS
      });
    }

    const nome = String(data.nome || '').trim();
    const email = String(data.email || '').trim().toLowerCase();

    if (!nome || !email) {
      return new Response(
        JSON.stringify({ error: 'Os campos nome e e-mail são obrigatórios.' }),
        { status: 422, headers: CORS_JSON_HEADERS }
      );
    }

    const lead = {
      nome,
      email,
      cpf: onlyLeadDigits(data.cpf),
      whatsapp: onlyLeadDigits(data.whatsapp),
      renda_mensal: toLeadNumberOrNull(data.renda_mensal ?? data.renda),
      valor_desejado: toLeadNumberOrNull(data.valor_desejado ?? data.valor),
      parcelas: toLeadNumberOrNull(data.parcelas) ?? 1,
      negativado: toLeadBoolean(data.negativado),
      aposentado: toLeadBoolean(data.aposentado ?? data.aposentado_inss),
      bolsafamilia: toLeadBoolean(data.bolsafamilia),
      facio_elegivel: toLeadBoolean(data.facio_elegivel ?? data.facioAvailable),
      created_at: new Date().toISOString()
    };

    const [d1Result, supaResult] = await Promise.allSettled([
      saveLeadToD1(db, lead),
      saveLeadToSupabase(env, lead)
    ]);

    const d1Ok = d1Result.status === 'fulfilled';
    const supaOk = supaResult.status === 'fulfilled';

    if (!d1Ok && !supaOk) {
      console.error('[LEADS_API_FATAL]', {
        d1Error: d1Result.reason?.message,
        supaError: supaResult.reason?.message
      });
      return new Response(JSON.stringify({
        ok: false,
        error: 'Erro ao salvar lead nos bancos de dados.',
        details: {
          d1: d1Result.reason?.message || 'Erro desconhecido',
          supabase: supaResult.reason?.message || 'Erro desconhecido'
        }
      }), {
        status: 500,
        headers: CORS_JSON_HEADERS
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      message: 'Lead capturado com sucesso!',
      created_at: lead.created_at,
      saved: {
        cloudflare_d1: d1Ok,
        supabase: supaOk
      },
      ...(d1Ok ? { d1_id: d1Result.value.id } : { d1_warning: d1Result.reason?.message }),
      ...(!supaOk ? { supabase_warning: supaResult.reason?.message } : {})
    }), {
      status: 200,
      headers: CORS_JSON_HEADERS
    });
  } catch (error) {
    console.error('[LEADS_API_EXCEPTION]', error?.message || error);
    return new Response(JSON.stringify({
      ok: false,
      error: `Erro interno do servidor: ${error.message}`
    }), {
      status: 500,
      headers: CORS_JSON_HEADERS
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // 1. Rota principal da API Facio (/api/facio)
    if (path === '/api/facio') {
      return handleFacioLeadgen(request, env);
    }

    // 2. Rota do Webhook da Facio (/api/facio-webhook)
    if (path === '/api/facio-webhook') {
      return handleFacioWebhook(request, env);
    }

    // 3. Rota de Leads (Cloudflare D1 "tirracred" + Supabase) — atende /api/leads e /api/capturar-lead
    if (path === '/api/leads' || path === '/api/capturar-lead') {
      return handleLeadsAPI(request, env);
    }

    // 4. Rota de Produtos (/api/products) — lê do D1 se vinculado, ou retorna [] sem erro 404
    if (path === '/api/products') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_JSON_HEADERS });
      }
      const db = getD1Database(env);
      if (db && request.method === 'GET') {
        try {
          const showAll = url.searchParams.get('all') === 'true';
          const query = showAll
            ? 'SELECT * FROM products ORDER BY priority_order ASC'
            : 'SELECT * FROM products WHERE ativo = 1 ORDER BY priority_order ASC';
          const { results } = await db.prepare(query).all();
          return new Response(JSON.stringify(results || []), {
            status: 200,
            headers: CORS_JSON_HEADERS
          });
        } catch (err) {
          console.warn('[PRODUCTS_D1_WARN]', err?.message || err);
        }
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: CORS_JSON_HEADERS
      });
    }

    // 5. Entrega os arquivos estáticos do site (index.html, cartoes.html, pages/, public/)
    if (env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_JSON_HEADERS
    });
  }
};

