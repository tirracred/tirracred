// Caminho no GitHub: functions/api/facio-webhook.js
// URL em Produção: https://tirracred.com/api/facio-webhook
// URL em Sandbox:  https://sandbox-tirracred.tirradigital.workers.dev/api/facio-webhook

const JSON_HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Cache-Control': 'no-store'
};

/**
 * Responde a verificações de saúde (GET/HEAD) caso a plataforma da Facio teste a URL
 */
export async function onRequestGet(context) {
  const { env } = context;
  const facioEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();

  return new Response(JSON.stringify({
    ok: true,
    service: 'tirracred-facio-webhook',
    environment: facioEnv
  }), {
    status: 200,
    headers: JSON_HEADERS
  });
}

/**
 * Processa eventos de Webhook enviados pela Facio (POST)
 * Ex: aceite de política, conexão Open Finance, aprovação de limite, depósito Pix realizado
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const facioEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();

  try {
    // Validação opcional de secret via header caso configurado no Cloudflare (FACIO_WEBHOOK_SECRET)
    if (env?.FACIO_WEBHOOK_SECRET) {
      const incomingToken =
        request.headers.get('x-facio-signature') ||
        request.headers.get('x-webhook-secret') ||
        request.headers.get('authorization');

      const expectedSecret = String(env.FACIO_WEBHOOK_SECRET).trim();
      if (incomingToken && !incomingToken.includes(expectedSecret)) {
        console.warn(`[FACIO_WEBHOOK_AUTH_WARN] env=${facioEnv} Invalid webhook signature/token header`);
        return new Response(JSON.stringify({ error: 'Unauthorized webhook signature' }), {
          status: 401,
          headers: JSON_HEADERS
        });
      }
    }

    const rawBody = await request.text();
    if (!rawBody) {
      console.warn(`[FACIO_WEBHOOK_EMPTY] env=${facioEnv} Received empty body`);
      return new Response(JSON.stringify({ error: 'Empty payload' }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }

    let eventData;
    try {
      eventData = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error(`[FACIO_WEBHOOK_PARSE_ERROR] env=${facioEnv} rawBody=${rawBody}`);
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: JSON_HEADERS
      });
    }

    // Extrai campos principais para facilitar filtros no Cloudflare Observability Logs
    const eventType =
      eventData?.event ||
      eventData?.type ||
      eventData?.status ||
      eventData?.eventType ||
      'unknown_event';

    const leadId =
      eventData?.leadId ||
      eventData?.id ||
      eventData?.requestId ||
      eventData?.data?.leadId ||
      null;

    const rawCpf =
      eventData?.cpf ||
      eventData?.personalInfo?.cpf ||
      eventData?.data?.cpf ||
      null;

    const maskedCpf = rawCpf
      ? String(rawCpf).replace(/\D/g, '').replace(/^(\d{3})\d{5}(\d{3})$/, '$1*****$2')
      : null;

    console.log(
      `[FACIO_WEBHOOK_EVENT] env=${facioEnv} event=${eventType} leadId=${leadId || 'N/A'} cpf=${maskedCpf || 'N/A'} payload=${JSON.stringify(eventData)}`
    );

    // Se o banco D1 (env.DB) estiver conectado, grava o histórico do webhook de forma não-bloqueante
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
          .bind(facioEnv, String(eventType), leadId ? String(leadId) : null, maskedCpf, JSON.stringify(eventData))
          .run();
      } catch (dbErr) {
        console.warn(`[FACIO_WEBHOOK_D1_SKIP] env=${facioEnv} message=${dbErr?.message || dbErr}`);
      }
    }

    return new Response(JSON.stringify({
      received: true,
      environment: facioEnv,
      event: eventType,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (error) {
    console.error(`[FACIO_WEBHOOK_ERROR] env=${facioEnv} error=${error?.stack || error?.message || error}`);
    return new Response(JSON.stringify({ error: 'Internal webhook processing error' }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }
}

