// netlify/functions/capturar-lead.js
const supabase = require('./utils/supabase');

const headers = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  // Suporte a preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Permite apenas POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido.' }) };
  }

  try {
    // Parse uma vez só o corpo da requisição
    const data = JSON.parse(event.body);
    const { nome, cpf, whatsapp, email, renda, valor, negativado, parcelas } = data;

    // Validação de campos obrigatórios
    if (!nome || !email) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({ error: 'Os campos nome e e-mail são obrigatórios.' })
      };
    }

    // (Opcional) Conversões de tipo para evitar erros de tipo no banco
    let negativadoBool = negativado;
    if (typeof negativadoBool === 'string') {
      negativadoBool = negativadoBool.toLowerCase() === 'true';  // "true"/"false" -> boolean
    }
    let rendaNum = (typeof renda === 'string' && renda !== '') ? Number(renda) : renda;
    let valorNum = (typeof valor === 'string' && valor !== '') ? Number(valor) : valor;
    let parcelasNum = (typeof parcelas === 'string' && parcelas !== '') ? parseInt(parcelas) : parcelas;

    // Insere os dados na tabela 'leads'
    const { error } = await supabase.from('leads').insert({
      nome,
      cpf,
      whatsapp,
      email,
      renda: rendaNum,
      valor: valorNum,
      negativado: negativadoBool,
      parcelas: parcelasNum
    });

    if (error) {
      throw error;  // se ocorrer erro na inserção, cai no catch
    }

    // Sucesso na inserção
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