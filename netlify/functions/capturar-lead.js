// functions/api/leads.js
// Compatível com Cloudflare Pages Functions — salva simultaneamente no Cloudflare D1 e no Supabase

const DEFAULT_SUPABASE_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Detecta automaticamente o binding do banco Cloudflare D1 ("tirracred")
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

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'on' || normalized === '1' || normalized === 'sim';
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const num = Number(String(value).replace(',', '.'));
  return Number.isNaN(num) ? null : num;
}

function onlyDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits || null;
}

async function saveLeadToD1(db, lead) {
  if (!db) {
    throw new Error('Binding do Cloudflare D1 não encontrado em env.');
  }

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

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const db = getD1Database(env);
  const url = new URL(request.url);

  if (request.method === 'GET') {
    if (!db) {
      return new Response(JSON.stringify({ error: 'Banco D1 não configurado.' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    try {
      const { results } = await db.prepare(
        'SELECT * FROM leads ORDER BY id DESC LIMIT 1000'
      ).all();

      return new Response(JSON.stringify(results || []), {
        status: 200,
        headers: { ...corsHeaders, 'Cache-Control': 'no-store' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: `Erro ao listar leads: ${error.message}` }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  if (request.method === 'DELETE') {
    if (!db) {
      return new Response(JSON.stringify({ error: 'Banco D1 não configurado.' }), {
        status: 500,
        headers: corsHeaders
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
          headers: corsHeaders
        });
      }

      await db.prepare('DELETE FROM leads WHERE id = ?').bind(Number(id)).run();
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: `Erro ao excluir lead: ${error.message}` }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const data = await request.json().catch(() => null);
    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'Corpo JSON inválido.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const nome = String(data.nome || '').trim();
    const email = String(data.email || '').trim().toLowerCase();

    if (!nome || !email) {
      return new Response(
        JSON.stringify({ error: 'Os campos nome e e-mail são obrigatórios.' }),
        { status: 422, headers: corsHeaders }
      );
    }

    const lead = {
      nome,
      email,
      cpf: onlyDigits(data.cpf),
      whatsapp: onlyDigits(data.whatsapp),
      renda_mensal: toNumberOrNull(data.renda_mensal ?? data.renda),
      valor_desejado: toNumberOrNull(data.valor_desejado ?? data.valor),
      parcelas: toNumberOrNull(data.parcelas) ?? 1,
      negativado: toBoolean(data.negativado),
      aposentado: toBoolean(data.aposentado ?? data.aposentado_inss),
      bolsafamilia: toBoolean(data.bolsafamilia),
      facio_elegivel: toBoolean(data.facio_elegivel ?? data.facioAvailable),
      created_at: new Date().toISOString()
    };

    const [d1Result, supaResult] = await Promise.allSettled([
      saveLeadToD1(db, lead),
      saveLeadToSupabase(env, lead)
    ]);

    const d1Ok = d1Result.status === 'fulfilled';
    const supaOk = supaResult.status === 'fulfilled';

    if (!d1Ok && !supaOk) {
      console.error('Falha total ao salvar lead:', {
        d1Error: d1Result.reason?.message,
        supaError: supaResult.reason?.message
      });
      return new Response(
        JSON.stringify({
          error: 'Erro interno ao salvar lead nos bancos de dados.',
          details: {
            d1: d1Result.reason?.message || 'Erro desconhecido',
            supabase: supaResult.reason?.message || 'Erro desconhecido'
          }
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Lead capturado com sucesso!',
        created_at: lead.created_at,
        saved: {
          cloudflare_d1: d1Ok,
          supabase: supaOk
        },
        ...(d1Ok ? { d1_id: d1Result.value.id } : { d1_warning: d1Result.reason?.message }),
        ...(!supaOk ? { supabase_warning: supaResult.reason?.message } : {})
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Erro ao capturar lead:', error);
    return new Response(
      JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
}
