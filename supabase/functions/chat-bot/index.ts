// supabase/functions/chat-bot/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Groq } from 'npm:groq-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, session_id, visitor_name } = await req.json()
    
    // Configurações (Pegando dos Secrets)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const groq = new Groq({ apiKey: Deno.env.get('GROQ_API_KEY') })

    // 1. Salvar mensagem do USER
    await supabase.from('chat_messages').insert({
      session_id,
      sender: 'user',
      content: message
    })

    // 2. Verificar se está em modo HUMANO (Se sim, para aqui)
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

    // 3. Buscar histórico para contexto
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

    // 4. Prompt do Sistema
    const systemPrompt = `
      Você é a assistente virtual da TirraCred, chamada Sofia.
      Cliente: ${visitor_name}.
      Foco: Empréstimos para negativados e cartões.
      Estilo: Curto, direto, brasileiro, use emojis.
      Nunca peça senhas.
    `

    // 5. Chamar Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation
      ],
      model: 'llama3-8b-8192',
      temperature: 0.6,
    })

    const aiResponse = completion.choices[0]?.message?.content || "Não entendi, pode repetir?"

    // 6. Salvar resposta da IA
    await supabase.from('chat_messages').insert({
      session_id,
      sender: 'ai',
      content: aiResponse
    })

    return new Response(JSON.stringify({ reply: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})