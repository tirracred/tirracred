// netlify/functions/config.js
const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao seu domínio
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Método não permitido.' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: 'As variáveis de ambiente do Supabase não estão configuradas no Netlify.' }) 
    };
  }

  // Retorna as chaves públicas para o frontend
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      supabaseUrl,
      supabaseAnonKey
    })
  };
};
