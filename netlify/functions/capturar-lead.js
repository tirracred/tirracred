// netlify/functions/capturar-lead.js
// -----------------------------------------------------------------------------
// Função serverless (Netlify) para capturar leads e gravar na tabela "leads" do
// Supabase. Agora persiste **todos** os campos que chegam do front‑end e faz
// validação adequada para evitar erros 502/500.
// -----------------------------------------------------------------------------

const supabase = require('./utils/supabase');

const headers = {
  'Access-Control-Allow-Origin': '*',            // 🔒 Ajuste para o seu domínio em produção
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  // 1) Pré‑flight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // 2) Apenas POST é permitido
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido.' })
    };
  }

  try {
    // 3) Parse do JSON recebido
    const body = JSON.parse(event.body || '{}');
    const {
      nome,
      cpf,
      whatsapp,
      email,
      renda,       // pode vir string ou number
      valor,       // obrig. number
      parcelas,    // obrig. number
      negativado,  // boolean opcional
      consent      // boolean opcional
    } = body;

    // 4) Validação mínima de obrigatórios
    const missing = [];
    if (!nome) missing.push('nome');
    if (!cpf) missing.push('cpf');
    if (!whatsapp) missing.push('whatsapp');
    if (!email) missing.push('email');
    if (valor === undefined) missing.push('valor');
    if (parcelas === undefined) missing.push('parcelas');

    if (missing.length) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: `Campos obrigatórios ausentes: ${missing.join(', ')}.`
        })
      };
    }

    // 5) Conversão de tipos (garantir consistência no banco)
    const rendaNumber = renda !== undefined ? Number(renda) : null;
    const valorNumber = Number(valor);
    const parcelasNumber = Number(parcelas);

    // 6) Inserção no Supabase
    const { error } = await supabase.from('leads').insert({
      nome,
      cpf,
      whatsapp,
      email,
      renda: rendaNumber,
      valor: valorNumber,
      parcelas: parcelasNumber,
      negativado: !!negativado,
      consent: !!consent
    });

    if (error) {
      console.error('Erro Supabase:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erro ao salvar lead no banco.' })
      };
    }

    // 7) Sucesso
    return {
      statusCode: 201,           // Created
      headers,
      body: JSON.stringify({ message: 'Lead capturado com sucesso!' })
    };
  } catch (err) {
    console.error('Erro inesperado:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor.' })
    };
  }
};
