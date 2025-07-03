// netlify/functions/login.js
const { createClient } = require('@supabase/supabase-js');

const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, use seu domínio
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Método não permitido.' }) };
  }

  // Inicializa o cliente Supabase (usando chave de serviço)
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: 'As variáveis de ambiente do Supabase não estão configuradas no Netlify.' }) 
    };
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });

  try {
    const { email, password } = JSON.parse(event.body);

    // Validação de entrada
    if (!email || !password) {
      return { 
        statusCode: 422, 
        headers, 
        body: JSON.stringify({ message: 'Email e senha são obrigatórios.' }) 
      };
    }

    // Tenta realizar login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Credenciais inválidas ou outro erro de autenticação
      return { 
        statusCode: 401, 
        headers, 
        body: JSON.stringify({ message: error.message }) 
      };
    }

    // Sucesso – retorna mensagem e sessão autenticada
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ 
        message: 'Login bem-sucedido!', 
        session: data.session 
      }) 
    };

  } catch (error) {
    console.error('Erro no login:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: `Erro interno do servidor: ${error.message}` }) 
    };
  }
};
