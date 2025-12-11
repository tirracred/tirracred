// Arquivo: supabase/functions/chat-bot/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Groq } from 'npm:groq-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Tratamento de CORS (Permite que seu site converse com a função)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, session_id, visitor_name } = await req.json()
    
    // 1. Validar Chaves
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!groqKey) throw new Error("GROQ_API_KEY não configurada.");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials ausentes.");

    // 2. Iniciar Clientes
    const supabase = createClient(supabaseUrl, supabaseKey);
    const groq = new Groq({ apiKey: groqKey });

    // 3. Salvar mensagem do Usuário no Banco
    await supabase.from('chat_messages').insert({
      session_id,
      sender: 'user',
      content: message
    })

    // 4. Verificar se o atendimento é Humano (pausa o robô)
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

    // 5. Carregar Histórico (Contexto)
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

    // 6. Prompt do Sistema (Personalidade)
    const systemPrompt = `
      Você é a Sofia, assistente da TirraCred.
      Cliente: ${visitor_name || 'Amigo'}.
      Foco: Empréstimos e Cartões.
      Estilo: Curto, amigável, brasileiro, use emojis.
      Nunca invente dados.
    `

    // 7. Chamada à IA (MODELO CORRIGIDO AQUI)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation
      ],
      // ATUALIZADO: Usando o modelo mais recente e estável
      model: 'llama-3.3-70b-versatile', 
      temperature: 0.6,
      max_tokens: 500,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "Desculpe, não entendi.";
    

    // 8. Salvar resposta da IA
    await supabase.from('chat_messages').insert({
      session_id,
      sender: 'ai',
      content: aiResponse
    })

    return new Response(JSON.stringify({ reply: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("ERRO NO BOT:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})