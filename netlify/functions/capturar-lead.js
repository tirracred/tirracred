// netlify/functions/capturar-lead.js

// Importa o cliente Supabase compartilhado do arquivo de utilitários.
const supabase = require('./utils/supabase');

// Define os cabeçalhos CORS para permitir requisições do seu frontend.
const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao seu domínio: 'https://seu-site.com'
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  // Trata a requisição pré-verificação (preflight) do CORS enviada pelos navegadores.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers,
      body: ''
    };
  }

  // Permite apenas o método POST para esta função.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      headers,
      body: JSON.stringify({ error: 'Método não permitido.' })
    };
  }

  try {
    // Analisa os dados enviados no corpo da requisição.
    const { nome, email } = JSON.parse(event.body);

    // Valida se os campos necessários foram fornecidos.
    if (!nome || !email) {
      return {
        statusCode: 422, // Unprocessable Entity
        headers,
        body: JSON.stringify({ error: 'Os campos nome e e-mail são obrigatórios.' })
      };
    }

    // Insere os dados na tabela 'leads' do Supabase.
    const { error } = await supabase.from('leads').insert({ nome, email });

    // Se o Supabase retornar um erro, lança-o para ser capturado pelo bloco catch.
    if (error) {
      throw error;
    }

    // Retorna uma resposta de sucesso.
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Lead capturado com sucesso!' })
    };

  } catch (error) {
    // Loga o erro para depuração nos logs da função Netlify.
    console.error('Erro ao capturar lead:', error);

    // Retorna uma resposta de erro genérica para o cliente.
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Erro interno do servidor: ${error.message}` })
    };
  }
};
