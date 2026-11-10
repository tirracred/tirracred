const FALLBACK_URL = 'https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=app&utm_campaign=ds_banner';

const DEFAULT_OFFER = {
  maxValue: 300.0,
  fee: 72.9,
  baseFee: 9.9,
  type: 'SalaryAdvance',
  description: 'Antecipe até R$ 300 com a Facio. Taxas a partir de R$ 9,90.'
};

async function callFacioAPI(baseUrl, endpoint, payload, authHeader, retries = 1) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify(payload)
  });

  
  if (response.status === 500 && retries > 0) {
    return callFacioAPI(baseUrl, endpoint, payload, authHeader, retries - 1);
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }
  }

  return { status: response.status, data };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const jsonHeaders = { 'Content-Type': 'application/json;charset=UTF-8' };

  try {
    const body = await request.json();
    const action = body.action;

    const facioEnv = (env && env.FACIO_ENV) ? env.FACIO_ENV : 'production';
    const baseUrl = facioEnv === 'sandbox'
      ? 'https://api.facio.dev/leadgen'
      : 'https://api.facio.com/leadgen';

    const facioUser = env ? env.FACIO_API_USER : null;
    const facioPass = env ? env.FACIO_API_PASSWORD : null;

    if (!facioUser || !facioPass) {
      if (action === 'availability') {
        return new Response(JSON.stringify({
          isAvailable: true,
          fallbackMode: true,
          offer: DEFAULT_OFFER,
          requestId: 'fallback-availability'
        }), { status: 200, headers: jsonHeaders });
      }

      if (action === 'lead') {
        return new Response(JSON.stringify({
          registrationUrl: FALLBACK_URL,
          offer: DEFAULT_OFFER,
          fallbackMode: true,
          requestId: 'fallback-lead'
        }), { status: 200, headers: jsonHeaders });
      }
    }

    const authHeader = 'Basic ' + btoa(`${facioUser}:${facioPass}`);

    if (action === 'availability') {
      const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        return new Response(JSON.stringify({ errors: ['cpf is not valid'] }), {
          status: 400,
          headers: jsonHeaders
        });
      }

      const result = await callFacioAPI(baseUrl, '/availability', { cpf: cleanCpf }, authHeader);
      return new Response(JSON.stringify(result.data || {}), {
        status: result.status,
        headers: jsonHeaders
      });
    }

    if (action === 'lead') {
      const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
      let cleanPhone = String(body.whatsapp || '').replace(/\D/g, '');

      if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
        cleanPhone = cleanPhone.slice(2);
      }

      const leadPayload = {
        personalInfo: {
          name: String(body.nome || '').trim(),
          cpf: cleanCpf
        },
        contactInfo: {
          email: String(body.email || '').trim().toLowerCase(),
          phone: cleanPhone
        },
        campaign: body.campaign || 'ds_banner',
        financialInfo: {
          loanAmount: Math.min(Number(body.valor) || 300.0, 300.0)
        },
        otherInfo: {
          hasCreditRestrictions: Boolean(body.negativado)
        }
      };

      const result = await callFacioAPI(baseUrl, '/lead', leadPayload, authHeader);

      if (result.status === 200 && result.data && result.data.registrationUrl) {
        return new Response(JSON.stringify(result.data), {
          status: 200,
          headers: jsonHeaders
        });
      }

      if (result.status === 409) {
        return new Response(JSON.stringify({
          error: 'user already registered',
          details: result.data
        }), { status: 409, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({
        error: 'validation_or_api_error',
        details: result.data,
        fallbackUrl: FALLBACK_URL
      }), { status: result.status, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: jsonHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      registrationUrl: FALLBACK_URL,
      offer: DEFAULT_OFFER,
      fallbackMode: true
    }), { status: 200, headers: jsonHeaders });
  }
}

