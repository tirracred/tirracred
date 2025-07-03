const { createClient } = require('@supabase/supabase-js');
// Inicializa o cliente Supabase com URL e chave do projeto (do env)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Habilita CORS se necessário (exemplo: permitir chamadas de qualquer origem)
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod !== 'POST') {
    // Só aceita POST; outros métodos retornam erro 405
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não suportado' }) };
  }

  try {
    // Tenta parsear o corpo da requisição (JSON vindo do frontend)
    const dados = JSON.parse(event.body);
    const { nome, email } = dados;

    // Insere os dados na tabela do Supabase (ajuste o nome da tabela conforme seu caso)
    const { error } = await supabase.from('leads').insert({ nome, email });

    if (error) {
      // Erro ao inserir no banco
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }

    // Sucesso - retorna um JSON indicando que deu certo
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Lead capturado com sucesso!' })
    };

  } catch (err) {
    // Possível erro de JSON inválido ou exceção geral
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Dados inv\u00e1lidos ou requisi\u00e7\u00e3o malformada.' })
    };
  }
};
