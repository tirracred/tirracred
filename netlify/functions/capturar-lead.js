// netlify/functions/capturar-lead.js
const supabase = require('./utils/supabase');

// Cabeçalhos CORS compartilhados para todas as respostas
const headers = {
  'Access-Control-Allow-Origin': '*',  // Em produção, ajuste para o domínio do seu site
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  // Tratamento da preflight request (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Permite apenas método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido.' })
    };
  }

  try {
    // Parse do corpo da requisição JSON
    const data = JSON.parse(event.body);
    const { nome, email } = data;
    const cpf = data.cpf || null;
    const whatsapp = data.whatsapp || null;
    let rendaMensal = data.renda;
    let valorDesejado = data.valor;
    let negativado = data.negativado;
    let parcelas = data.parcelas;

    // Validação dos campos obrigatórios
    if (!nome || !email) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({ error: 'Os campos nome e e-mail são obrigatórios.' })
      };
    }

    // Conversão de tipos dos campos opcionais
    if (typeof negativado !== 'boolean') {
      // Trata strings "true"/"on" ou booleanos truthy/falsy
      negativado = (negativado === true || negativado === 'true' || negativado === 'on');
    }
    if (rendaMensal !== undefined && rendaMensal !== null) {
      rendaMensal = Number(rendaMensal);
      if (isNaN(rendaMensal)) rendaMensal = null;
    }
    if (valorDesejado !== undefined && valorDesejado !== null) {
      valorDesejado = Number(valorDesejado);
      if (isNaN(valorDesejado)) valorDesejado = null;
    }
    if (parcelas !== undefined && parcelas !== null) {
      parcelas = Number(parcelas);
      if (isNaN(parcelas)) parcelas = null;
    }

    // Monta o objeto com nomes de coluna corretos
    const newLead = {
      nome,
      email,
      ...(cpf ? { cpf } : {}),
      ...(whatsapp ? { whatsapp } : {}),
      ...(rendaMensal !== undefined ? { renda_mensal: rendaMensal } : {}),
      ...(valorDesejado !== undefined ? { valor_desejado: valorDesejado } : {}),
      ...(negativado !== undefined ? { negativado } : {}),
      ...(parcelas !== undefined ? { parcelas } : {})
    };

    // Insere na tabela 'leads'
    const { error } = await supabase.from('leads').insert(newLead);
    if (error) throw error;  // Lança erro para cair no catch em caso de falha

    // Sucesso
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Lead capturado com sucesso!' })
    };

  } catch (error) {
    console.error('Erro ao capturar lead:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Erro interno do servidor: ${error.message}` })
    };
  }
};