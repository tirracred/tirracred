// Caminho obrigatório no GitHub: functions/api/facio-webhook.js
// URL em Produção: https://tirracred.com/api/facio-webhook
// URL em Sandbox:  https://sandbox-tirracred.tirradigital.workers.dev/api/facio-webhook

const JSON_HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Cache-Control': 'no-store'
};

/**
 * Responde a verificações de saúde (GET)
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
 * Eventos oficiais: privacyPolicyAccepted, openFinanceDataShared, deposited
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const facioEnv = String(env?.FACIO_ENV || 'production').trim().toLowerCase();

  try {
    // Validação do token Bearer caso FACIO_WEBHOOK_SECRET esteja configurado no Cloudflare
    if (env?.FACIO_WEBHOOK_SECRET) {
      const incomingToken =
        request.headers.get('authorization') ||
        request.headers.get('x-facio-signature') ||
        request.headers.get('x-webhook-secret');

      const expectedSecret = String(env.FACIO_WEBHOOK_SECRET).trim();
      if (!incomingToken || !incomingToken.includes(expectedSecret)) {
        console.warn(`[FACIO_WEBHOOK_AUTH_WARN] env=${facioEnv} Missing or invalid webhook token header`);
        return new Response(JSON.stringify({ error: 'Unauthorized webhook token' }), {
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

    // Campos oficiais da documentação de Webhooks da Facio: partnerCustomerId, campaign, event, eventDate
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
      `[FACIO_WEBHOOK_EVENT] env=${facioEnv} event=${eventType} partnerCustomerId=${partnerCustomerId || 'N/A'} campaign=${campaign} eventDate=${eventDate} payload=${JSON.stringify(eventData)}`
    );

    // Se o banco D1 (env.DB) estiver conectado, grava de forma idempotente por partnerCustomerId + event
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
        console.warn(`[FACIO_WEBHOOK_D1_SKIP] env=${facioEnv} message=${dbErr?.message || dbErr}`);
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

