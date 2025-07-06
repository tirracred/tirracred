// netlify/functions/send-welcome-email.js

// Usamos node-fetch para compatibilidade com o ambiente Netlify blablablabla
const fetch = require('node-fetch');

// Endpoint da API do Zoho para o seu centro de dados (Europa)
const ZOHO_API_ENDPOINT = "https://mail.zoho.eu/api/accounts/{accountId}/messages";
// NOTA: Se o envio falhar com erro de "invalid_account", você precisará obter o seu {accountId}.
// Uma forma de o obter é fazendo uma chamada GET para https://mail.zoho.eu/api/accounts com um token de acesso válido.

// Função para obter um novo token de acesso usando o refresh token
async function getAccessToken() {
  const response = await fetch("https://accounts.zoho.eu/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erro ao obter access token do Zoho:", data);
    throw new Error(`Erro ao obter access token: ${data.error}`);
  }
  return data.access_token;
}

exports.handler = async function(event) {
  // Esta função será chamada pelo trigger do Supabase, que envia um POST.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido.' })
    };
  }

  try {
    // O corpo do request virá do nosso trigger do banco de dados
    const { record } = JSON.parse(event.body);
    const leadEmail = record.email;
    const leadName = record.name;

    if (!leadEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "O e-mail do lead está em falta." })
      };
    }

    const accessToken = await getAccessToken();

    const emailPayload = {
      fromAddress: "atendimento@tirracred.com.br", // <-- MUDE ISTO para o seu e-mail verificado no Zoho
      toAddress: leadEmail,
      subject: `Bem-vindo à nossa comunidade, ${leadName}!`,
      content: `Olá ${leadName},<br><br>Obrigado por se inscrever! Estamos muito felizes por ter você connosco.<br><br>Atenciosamente,<br>Equipe TirraCred`,
      mailFormat: "html",
    };

    const zohoResponse = await fetch(ZOHO_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!zohoResponse.ok) {
      const errorData = await zohoResponse.json();
      console.error("Erro ao enviar e-mail pelo Zoho:", errorData);
      // Inclui a resposta do Zoho no erro para facilitar a depuração
      throw new Error(`Falha ao enviar e-mail pelo Zoho: ${JSON.stringify(errorData)}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "E-mail enviado com sucesso!" })
    };

  } catch (error) {
    console.error("Erro na Netlify Function:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};