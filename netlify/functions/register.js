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
    const { nome, email, password, cpf, whatsapp, marketing_consent } = JSON.parse(event.body);

    // Valida dados essenciais
    if (!email || !password) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({ error: 'Email e senha são obrigatórios.' })
      };
    }

    // Tenta registrar um novo usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Adiciona metadados ao usuário que serão salvos na tabela auth.users
        data: { 
          full_name: nome, 
          cpf, 
          whatsapp, 
          marketing_consent 
        }
      }
    });

    if (error) {
      // Se houver um erro do Supabase (ex: email já existe), retorna o erro.
      return { 
        statusCode: 400, // Bad Request
        headers,
        body: JSON.stringify({ error: error.message }) 
      };
    }

    return { 
      statusCode: 201, // Created
      headers,
      body: JSON.stringify({ 
        message: "Utilizador criado com sucesso!", 
        user: data.user 
      }) 
    };

  } catch (error) {
    console.error('Erro no registro:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }) 
    };
  }
};