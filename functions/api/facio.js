// Caminho no GitHub: functions/api/facio.js

const FALLBACK_URL = 'https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=app&utm_campaign=ds_banner';

async function callFacioAPI(baseUrl, endpoint, payload, authHeader, retries = 1) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify(payload)
  });

  // A doc da Facio orienta repetir a chamada em caso de erro 500
  if (response.status === 500 && retries > 0) {
    return callFacioAPI(baseUrl, endpoint, payload, authHeader, retries - 1);
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = null; }
  }

  return { status: response.status, data };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const jsonHeaders = {
    'Content-Type': 'application/json;charset=UTF-8'
  };

  try {
    const body = await request.json();
    const { action } = body;

    const FACIO_ENV = env.FACIO_ENV || 'production'; // 'sandbox' ou 'production'
    const BASE_URL = FACIO_ENV === 'sandbox'
      ? 'https://api.facio.dev/leadgen'
      : 'https://api.facio.com/leadgen';

    const FACIO_USER = env.FACIO_API_USER;
    const FACIO_PASS = env.FACIO_API_PASSWORD;

    // Modo Fallback: Se você ainda não tiver colocado o usuário/senha da API no Cloudflare,
    // ele libera o card visual e joga o cliente para o seu link de afiliado da Facio!
    if (!FACIO_USER || !FACIO_PASS) {
      if (action === 'availability') {
        return new Response(JSON.stringify({
          isAvailable: true,
          fallbackMode: true,
          offer: {
            maxValue: 300.0,
            fee: 72.9,
            baseFee: 9.9,
            type: 'SalaryAdvance',
            description: 'Antecipe até R$ 300 com a Facio. Taxas a partir de R$ 9,90.'
          }
        }), { status: 200, headers: jsonHeaders });
      }

      if (action === 'lead') {
        return new Response(JSON.stringify({
          registrationUrl: FALLBACK_URL,
          fallbackMode: true
        }), { status: 200, headers: jsonHeaders });
      }
    }

    // Autenticação Basic Auth nativa do Cloudflare Workers (btoa)
    const authHeader = 'Basic ' + btoa(`${FACIO_USER}:${FACIO_PASS}`);

    // ==========================================
    // 1. API DE CONSULTA: POST /leadgen/availability
    // ==========================================
    if (action === 'availability') {
      const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        return new Response(JSON.stringify({ errors: ['cpf is not valid'] }), {
          status: 400,
          headers: jsonHeaders
        });
      }

      const result = await callFacioAPI(BASE_URL, '/availability', { cpf: cleanCpf }, authHeader);
      return new Response(JSON.stringify(result.data || {}), {
        status: result.status,
        headers: jsonHeaders
      });
    }

    // ==========================================
    // 2. API DE CADASTRO: POST /leadgen/lead
    // ==========================================
    if (action === 'lead') {
      const cleanCpf = String(body.cpf || '').replace(/\D/g, '');
      let cleanPhone = String(body.whatsapp || '').replace(/\D/g, '');

      // Remddddove o DDI 55 se o cliente tiver preenchido
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
          phone: cleanPhone // Formato exigido pela Facio: XX9XXXXXXXX
        },
        campaign: body.campaign || 'ds_banner',
        financialInfo: {
          loanAmount: Number(body.valor) || 300.0
        },
        otherInfo: {
          hasCreditRestrictions: Boolean(body.negativado)
        }
      };

      const result = await callFacioAPI(BASE_URL, '/lead', leadPayload, authHeader);

      // 200 OK -> Janela de atribuição de 7 dias aberta!
      if (result.status === 200 && result.data?.registrationUrl) {
        return new Response(JSON.stringify({
          registrationUrl: result.data.registrationUrl,
          partnerCustomerId: result.data.partnerCustomerId,
          offer: result.data.offer,
          requestId: result.data.requestId
        }), { status: 200, headers: jsonHeaders });
      }

      // 409 Conflict -> CPF indisponível (já tem janela ativa de outro canal ou já depositou)
      if (result.status === 409) {
        return new Response(JSON.stringify({
          error: 'CPF não atribuível neste momento.',
          details: result.data
        }), { status: 409, headers: jsonHeaders });
      }

      // 400 ou demais códigos -> retorna fallbackUrl para não perder o clique do cliente
      return new Response(JSON.stringify({
        error: 'Erro de validação nos dados enviados.',
        details: result.data,
        fallbackUrl: FALLBACK_URL
      }), { status: result.status, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: jsonHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      registrationUrl: FALLBACK_URL,
      fallbackMode: true
    }), { status: 200, headers: jsonHeaders });
  }
}