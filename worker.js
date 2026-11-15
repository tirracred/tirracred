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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

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

    // 3. Evita erro 404 no F12 quando o index.html busca /api/products antes do Supabase
    if (path === '/api/products') {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: CORS_JSON_HEADERS
      });
    }

    // 4. Entrega os arquivos estáticos do site (index.html, cartoes.html, pages/, public/)
    if (env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};

