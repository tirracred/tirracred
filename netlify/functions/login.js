const supabase = require('./utils/supabase');

const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao seu domínio
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Método não permitido.' }) 
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Valida dados
    if (!email || !password) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({ error: 'Email e senha são obrigatórios.' })
      };
    }

    // Tenta fazer login com o Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      // Se houver um erro do Supabase (ex: credenciais inválidas), retorna o erro.
      return { 
        statusCode: 401, // Unauthorized
        headers,
        body: JSON.stringify({ error: error.message }) 
      };
    }

    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ 
        message: "Login bem-sucedido!", 
        session: data.session 
      }) 
    };

  } catch (error) {
    console.error('Erro no login:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }) 
    };
  }
};