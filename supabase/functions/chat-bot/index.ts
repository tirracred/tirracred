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

    // Chaves
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!groqKey || !supabaseUrl || !supabaseKey) throw new Error("Configuração ausente.");

    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const groq = new Groq({ apiKey: groqKey });

    // 1. Salva User Msg
    await supabase.from('chat_messages').insert({
      session_id, sender: 'user', content: message
    })

    // 2. Carrega Histórico (Contexto)
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

    // 3. PROMPT DE VENDAS COM "CAMINHOS DISTINTOS"
    const systemPrompt = `
Você é a Isabel, consultora da TirraCred.
Seu objetivo é qualificar ${visitor_name || 'o cliente'} e enviar o LINK DE AFILIADO correto.

## SEU ESTOQUE (USE APENAS ESTES LINKS):
[EMPRÉSTIMOS]
- Garantia de Veículo (Carro/Moto): https://curt.link/tirragv (Mande pro Zap)
- Antecipação FGTS: https://curt.link/izabelfgts
- Empréstimo Pessoal (Nome Sujo/Facio): https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=web-app
- SuperSim: https://susim.co/wwjLtRkN81wwsLSCGK9aHQ==

[CARTÕES DE CRÉDITO / CONTAS]
- PicPay (Aprova Fácil): https://apretailer.com.br/click/68ebe1712bfa8110ed15a9b2/186179/355952/subaccount
- Santander (Melhor Limite): https://apretailer.com.br/click/690eb20e2bfa814aa46585a1/187685/355952/subaccount
- Mercado Pago: https://mpago.li/1hWgZWN

## REGRAS DE OURO:
1. NUNCA cite bancos fora da lista (Nada de Nubank, Inter, Bradesco). Venda SÓ o que temos.
2. Respostas CURTAS (Max 20 palavras). Estilo WhatsApp Brasileiro.
3. Se o cliente pedir CARTÃO, não ofereça EMPRÉSTIMO (e vice-versa).

## ROTEIRO (CAMINHOS):

### CAMINHO A: Cliente quer DINHEIRO/EMPRÉSTIMO (Padrão)
1. Pergunte: "Tem carro ou moto quitado no seu nome? O valor é maior."
   - Se SIM: Mande link Veículo.
   - Se NÃO: Pergunte: "Trabalha CLT ou tem saldo no FGTS?"
     - Se SIM: Link FGTS.
     - Se NÃO: Link Facio/SuperSim (Diga: "Tenho uma pré-aprovação pra vc aqui").

### CAMINHO B: Cliente pede CARTÃO DE CRÉDITO
1. Não pergunte de carro. Ofereça direto as opções de fácil aprovação.
2. Diga: "Para cartão, os que mais aprovam hoje são Santander e PicPay. Qual vc prefere tentar?"
   - Se ele escolher um, mande o link correspondente.
   - Se disser "qualquer um" ou "todos", mande o do Santander e PicPay juntos.

## EXEMPLOS DE RESPOSTA:
Usuario: "Quero cartão"
Isabel: "Show! O Santander e o PicPay tão aprovando muito hoje. Quer o link deles pra tentar?"

Usuario: "Não tenho carro"
Isabel: "Entendi! E vc trabalha registrado ou tem saldo no FGTS parada?"
`;

    // 4. Chamada IA
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation
      ],
      model: 'llama-3.3-70b-versatile', // Melhor modelo da Groq
      temperature: 0.4, // Baixa temperatura para ele inventar menos
      max_tokens: 150,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "Vou verificar aqui... 👩‍💻";

    // 5. Salvar resposta
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
