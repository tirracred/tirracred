// Arquivo: supabase/functions/chat-bot/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Groq } from 'npm:groq-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, session_id, visitor_name } = await req.json()
    
    // 1. VERIFICAÇÃO DE CHAVES (Diagnóstico de erro 500)
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!groqKey) {
      console.error("ERRO CRÍTICO: GROQ_API_KEY não encontrada nos Secrets!");
      throw new Error("Configuração de API ausente (Groq)");
    }
    if (!supabaseUrl || !supabaseKey) {
      console.error("ERRO CRÍTICO: Chaves do Supabase não encontradas!");
      throw new Error("Configuração de API ausente (Supabase)");
    }

    // 2. Inicializa Clientes
    const supabase = createClient(supabaseUrl, supabaseKey);
    const groq = new Groq({ apiKey: groqKey });

    // 3. Salva mensagem do USER
    const { error: dbError } = await supabase.from('chat_messages').insert({
      session_id,
      sender: 'user',
      content: message
    })

    if (dbError) console.error("Erro ao salvar msg user:", dbError);

    // 4. Verifica status 'human'
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('status')
      .eq('id', session_id)
      .single()

    if (session?.status === 'human') {
      return new Response(JSON.stringify({ status: 'human_mode' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Histórico
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(6)

    const conversation = (history || []).reverse().map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    // 6. Prompt do Sistema
    const systemPrompt = `
      Você é a Sofia, assistente virtual da TirraCred.
      Cliente: ${visitor_name || 'Visitante'}.
      Objetivo: Ajudar com empréstimos (FGTS, Pessoal) e Cartões.
      Personalidade: Amigável, usa emojis, respostas curtas e diretas (max 2 frases).
      Regra: Nunca pedir senhas. Se não souber, peça para chamar no WhatsApp.
    `

    // 7. Chama Groq
    console.log("Enviando para Groq...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation
      ],
      model: 'llama3-8b-8192',
      temperature: 0.6,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "Desculpe, não entendi.";
    console.log("Resposta da IA:", aiResponse);

    // 8. Salva resposta da IA
    await supabase.from('chat_messages').insert({
      session_id,
      sender: 'ai',
      content: aiResponse
    })

    return new Response(JSON.stringify({ reply: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("ERRO GERAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, // Retorna o erro 500 mas com detalhes no corpo
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})