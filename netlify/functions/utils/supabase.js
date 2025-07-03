// netlify/functions/utils/supabase.js

const { createClient } = require('@supabase/supabase-js');

// Obtém as variáveis de ambiente do Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente essenciais estão configuradas.
// Se não estiverem, a função irá falhar com uma mensagem de erro clara nos logs.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias.');
}

// Cria e exporta uma única instância do cliente Supabase para ser reutilizada em outras funções.
// Isso melhora o desempenho ao reutilizar conexões em invocações "quentes" da função.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
