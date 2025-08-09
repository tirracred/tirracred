const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao seu domínio
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  // Trata requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido.' })
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // Valida se as variáveis de ambiente estão presentes
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('As variáveis de ambiente do Supabase não estão configuradas no Netlify.');
    }

    // Retorna as chaves públicas para o frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        supabaseUrl,
        supabaseAnonKey,
      })
    };

  } catch (error) {
    console.error('Erro na função de configuração:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
