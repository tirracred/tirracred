const { createClient } = require('@supabase/supabase-js');

const headers = {
  'Access-Control-Allow-Origin': '*', // Em produção, use seu domínio aqui
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
    const { nome, email } = JSON.parse(event.body);

    // Validação de campos obrigatórios
    if (!nome || !email) {
      return { 
        statusCode: 422, 
        headers, 
        body: JSON.stringify({ message: 'Os campos nome e e-mail são obrigatórios.' }) 
      };
    }

    // Insere o lead no Supabase
    const { error } = await supabase.from('leads').insert({ nome, email });
    if (error) {
      // Erro ao inserir (por exemplo, registro duplicado ou falha no banco)
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ message: error.message }) 
      };
    }

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
      body: JSON.stringify({ message: `Erro interno do servidor: ${error.message}` }) 
    };
  }
};