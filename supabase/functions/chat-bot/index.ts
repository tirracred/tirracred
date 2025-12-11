// Arquivo: supabase/functions/chat-bot/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Groq } from 'npm:groq-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message, session_id, visitor_name } = await req.json()

    const groqKey = Deno.env.get('GROQ_API_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!groqKey || !supabaseUrl || !supabaseKey) throw new Error("Configuração ausente.");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const groq = new Groq({ apiKey: groqKey });

    // --- DETECÇÃO DE START ---
    let userContentForAI = message;
    
    if (message === '##START##') {
        // Se for o start automático, NÃO SALVA no banco como mensagem de usuário
        // Mas instrui a IA a começar
        userContentForAI = `O cliente ${visitor_name} acabou de entrar no chat. Dê uma saudação curta e pergunte se ele tem carro/moto quitado.`;
    } else {
        // Se for mensagem normal, salva no histórico
        await supabase.from('chat_messages').insert({
            session_id, sender: 'user', content: message
        })
    }

    // Carrega Histórico (Pode vir vazio se for o start)
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

    // Adiciona a "intenção atual" ao final
    const messages = [
        { role: 'system', content: `
Você é a Isabel, consultora da TirraCred.
Seu objetivo é qualificar ${visitor_name || 'o cliente'} e enviar o LINK DE AFILIADO correto.

## ESTOQUE DE LINKS:
[EMPRÉSTIMOS]
- Garantia de Veículo: https://curt.link/tirragv
- FGTS: https://curt.link/izabelfgts
- Facio (Nome Sujo): https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=web-app
- SuperSim: https://susim.co/wwjLtRkN81wwsLSCGK9aHQ==

[CARTÕES]
- PicPay: https://apretailer.com.br/click/68ebe1712bfa8110ed15a9b2/186179/355952/subaccount
- Santander: https://apretailer.com.br/click/690eb20e2bfa814aa46585a1/187685/355952/subaccount
- Mercado Pago: https://mpago.li/1hWgZWN

## REGRAS:
1. Respostas CURTAS (Max 20 palavras). Estilo WhatsApp.
2. NUNCA invente bancos (Nubank, etc). Só os da lista.
3. Se o cliente pedir CARTÃO, mande Santander/PicPay. Não ofereça empréstimo.

## ROTEIRO PADRÃO (EMPRÉSTIMO):
1. Pergunte: "Oi! Tem carro ou moto quitado? O valor libera na hora."
2. Se NÃO tiver carro, pergunte: "Trabalha CLT ou tem FGTS?"
3. Se NÃO tiver FGTS, mande Facio/SuperSim.

## ROTEIRO CARTÃO:
1. Se ele pedir cartão, mande Santander e PicPay direto.
` 
        },
        ...conversation,
        { role: 'user', content: userContentForAI } // Aqui entra o gatilho "O cliente acabou de entrar..."
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 150,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "Oi! Tudo bem?";

    // Salva a resposta da IA (Isso vai disparar o Realtime no Frontend)
    await supabase.from('chat_messages').insert({
      session_id, sender: 'ai', content: aiResponse
    })

    return new Response(JSON.stringify({ reply: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
