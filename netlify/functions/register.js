// netlify/functions/register.js
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
    const { nome, email, password, cpf, whatsapp, marketing_consent } = JSON.parse(event.body);

    // Validação de campos obrigatórios
    if (!email || !password) {
      return { 
        statusCode: 422, 
        headers, 
        body: JSON.stringify({ message: 'Email e senha são obrigatórios.' }) 
      };
    }

    // Cria o usuário no Supabase Auth, adicionando metadados do perfil
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: nome,
          cpf,
          whatsapp,
          marketing_consent 
        }
      }
    });
    if (error) {
      // Retorna erro (por ex., email já cadastrado)
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: error.message }) 
      };
    }

    // Sucesso – usuário criado
    return { 
      statusCode: 201, 
      headers, 
      body: JSON.stringify({ 
        message: 'Utilizador criado com sucesso!',
        user: data.user 
      }) 
    };

  } catch (error) {
    console.error('Erro no registro:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ message: `Erro interno do servidor: ${error.message}` }) 
    };
  }
};
