// Caminho no GitHub: functions/api/facio-webhook.js
// URL gerada automaticamente: https://tirracred.com/api/facio-webhook

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const eventData = await request.json();

    // Registra nos logs do Cloudflare o evento recebido da Facio
    // (Ex: aceite de política, conexão Open Finance, depósito realizado)
    console.log('Webhook Facio recebido:', JSON.stringify(eventData));

    // A Facio espera status 200 OK para confirmar o recebimento da notificação
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
