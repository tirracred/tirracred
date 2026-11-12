// Caminho obrigatório no GitHub: functions/api/facio.js
// URL em Produção: https://tirracred.com/api/facio
// URL em Sandbox:  https://sandbox-tirracred.tirradigital.workers.dev/api/facio

const FALLBACK_URL = 'https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=app&utm_campaign=ds_banner';

const DEFAULT_OFFER = {
  maxValue: 300.0,
  fee: 72.9,
  baseFee: 9.9,
  type: 'SalaryAdvance',
  description: 'Até R$ 300, oferta personalizada após análise.'
};

// Timeout de 15 segundos recomendado no Guia Rápido de Integração da Facio
const FACIO_TIMEOUT_MS = 15000;

const CORS_JSON_HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Responde preflight CORS (OPTIONS) para permitir chamadas entre tirracred.com e *.workers.dev / *.pages.dev
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_JSON_HEADERS
  });
}

/**
 * Responde GET para verificação rápida no navegador (https://tirracred.com/api/facio)
 */
export async function onRequestGet(context) {
  const { env } = context;
  const rawEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();
  const facioEnv = rawEnv === 'sandbox' ? 'sandbox' : 'production';
  const hasCredentials = Boolean(env?.FACIO_API_USER && env?.FACIO_API_PASSWORD);

  return new Response(JSON.stringify({
    ok: true,
    service: 'tirracred-facio-leadgen',
    environment: facioEnv,
    credentialsConfigured: hasCredentials
  }), {
    status: 200,
    headers: CORS_JSON_HEADERS
  });
}

/**
 * Valida matematicamente os 11 dígitos e verificadores do CPF
 */
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

/**
 * Sanitiza e valida o payload do Lead exatamente no formato oficial da LeadGen API da Facio
 */
function validateAndFormatLeadPayload(body) {
  const errors = [];

  const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
  if (!isValidCPF(cleanCpf)) {
    errors.push('personalInfo.cpf must have 11 valid digits');
  }

  const cleanName = String(body.nome || '')
    .replace(/\s+/g, ' ')
    .trim();
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

/**
 * Realiza chamada à API da Facio com timeout de 15s, retry em erro 5xx/rede e logs detalhados
 */
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
      console.warn(`[FACIO_API_RETRY] Retrying ${endpoint} after network/timeout error...`);
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

export async function onRequestPost(context) {
  const { request, env } = context;
  let action = null;

  try {
    const body = await request.json();
    action = body?.action;

    const rawEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();
    const facioEnv = rawEnv === 'sandbox' ? 'sandbox' : 'production';
    const baseUrl = facioEnv === 'sandbox'
      ? 'https://api.facio.dev/leadgen'
      : 'https://api.facio.com/leadgen';

    const facioUser = env?.FACIO_API_USER ? String(env.FACIO_API_USER).trim() : '';
    const facioPass = env?.FACIO_API_PASSWORD ? String(env.FACIO_API_PASSWORD).trim() : '';

    if (!facioUser || !facioPass) {
      console.error(
        `[FACIO_CONFIG_ERROR] Missing FACIO_API_USER or FACIO_API_PASSWORD in environment (${facioEnv}).`
      );
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

    // =========================================================================
    // 1. CONSULTA DE ELEGIBILIDADE (POST /leadgen/availability)
    // =========================================================================
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

      const result = await callFacioAPI(
        baseUrl,
        '/availability',
        { cpf: cleanCpf },
        authHeader,
        facioEnv
      );

      // Caso a API da Facio esteja fora do ar (timeout ou 5xx), aciona fallback de contingência
      if (result.isServerOrNetworkError) {
        console.warn(`[FACIO_FALLBACK] Availability fallback triggered due to upstream status ${result.status}`);
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

    // =========================================================================
    // 2. CRIAÇÃO E REGISTRO DE LEAD (POST /leadgen/lead)
    // =========================================================================
    if (action === 'lead') {
      const validation = validateAndFormatLeadPayload(body);

      if (!validation.isValid) {
        console.warn(
          `[FACIO_VALIDATION_ERROR] env=${facioEnv} cpf=${validation.cleanCpf} errors=${JSON.stringify(validation.errors)}`
        );
        return new Response(JSON.stringify({
          error: 'invalid_payload',
          validationError: true,
          errors: validation.errors
        }), {
          status: 400,
          headers: CORS_JSON_HEADERS
        });
      }

      const result = await callFacioAPI(
        baseUrl,
        '/lead',
        validation.payload,
        authHeader,
        facioEnv
      );

      // Sucesso (200 OK): retorna registrationUrl e partnerCustomerId oficiais da Facio
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

      // 409 Conflict: user already registered (janela ativa de outro canal ou cliente já convertido)
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

      // Fallback restrito apenas a erro real de servidor da Facio (5xx ou timeout/rede)
      if (result.isServerOrNetworkError) {
        console.warn(`[FACIO_FALLBACK] Lead fallback triggered due to upstream status ${result.status}`);
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

      // Erros 4xx da Facio (400, 401, 403, 422)
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
