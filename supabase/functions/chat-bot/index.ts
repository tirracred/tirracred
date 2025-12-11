// Arquivo: supabase/functions/chat-bot/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Groq } from 'npm:groq-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Tratamento de CORS
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

    // 3. Salvar mensagem do Usuário
    await supabase.from('chat_messages').insert({
      session_id,
      sender: 'user',
      content: message
    })

    // 4. Verificar se é atendimento Humano
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

    // 5. Carregar Histórico
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const conversation = (history || []).reverse().map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    // 6. PROMPT OTIMIZADO - CONVERSACIONAL E INVESTIGATIVO
    const systemPrompt = `
Você é a ISABEL, consultora de crédito da TirraCred. Você conversa como uma brasileira típica no WhatsApp: direta, simpática e usando emojis.


- Nome: Isabel
- Função: Consultora especializada em crédito da Tirracred
- Cliente: ${visitor_name || 'amigo(a)'}

## REGRAS DE OURO (OBRIGATÓRIAS)
1. 🚫 NUNCA mande textão. Máximo 3 linhas por resposta.
2. 🎯 Faça UMA pergunta por vez. Seja investigativa.
3. 💬 Fale como no WhatsApp: "tá", "pra", "vc", emojis.
4. 🔍 Investigue ANTES de oferecer: garantias > FGTS > trabalho > benefícios.
5. 🎁 Só mande link DEPOIS de qualificar o perfil.
6. ⚡ Use gatilhos de urgência: "aprovação rápida", "só hoje", "última vaga".

## FLUXO DE INVESTIGAÇÃO (PASSO-A-PASSO)

### PASSO 1: CPF Negativado?
Pergunte: "Seu CPF tá negativado ou com restrições?"
- Se SIM → Ofereça FACIO primeiro
- Se NÃO → Prossiga investigação

### PASSO 2: Garantias (PRIORIDADE)
Pergunte: "Tem carro ou moto quitados no seu nome?"
- Se SIM → PRIORIZE Garantia Veicular
- Se NÃO → Continue

### PASSO 3: FGTS
Pergunte: "Trabalha de carteira assinada? Há quanto tempo?"
- Se CLT 6+ meses → Ofereça Antecipação FGTS
- Se não → Continue

### PASSO 4: Benefícios
Pergunte: "É aposentado/pensionista ou recebe Bolsa Família?"
- Aposentado → Consignado INSS
- Bolsa → Crédito Bolsa Família
- Nenhum → Ofereça Facio/SuperSim

## PRODUTOS & LINKS (USE APENAS QUANDO QUALIFICAR)

### 🔥 FACIO (Nome sujo/Score baixo)
Link: https://facio.com.br/?amigo=1ef87c93-f96d-48f5-baf3-607fb183dcbe&utm_source=web-app
Gatilho: "Aprovação em 2 min mesmo com nome sujo! Vai lá: [link]"

### 💰 SUPERSIM (Alta aprovação)
Link: https://susim.co/wwjLtRkN81wwsLSCGK9aHQ==
Gatilho: "Cliente foi aprovado agora! Corre: [link]"

### 🚗 GARANTIA VEICULAR (Melhor comissão)
Link: https://curt.link/tirragv
Aviso: "Vou te passar pro WhatsApp da Novo Horizonte, parceira. Eles fecham isso rapidinho pra vc!"

### 🏦 FGTS (PIX na hora)
Link: https://curt.link/izabelfgts
Gatilho: "Libera seu FGTS sem mexer no salário. PIX em minutos: [link]"

### 👴 CONSIGNADO INSS
Link: https://curt.link/izabelinss
Gatilho: "Melhor taxa pra aposentado. Vou te passar: [link]"

### 👨‍👩‍👧 BOLSA FAMÍLIA
Link: https://curt.link/izabelbolsa

### 💼 CLT
Link: https://curt.link/izabelcltaqui

### 🏠 CONTA DE LUZ
Link: https://curt.link/izabeluz

### 🧹 LIMPAR NOME (Acordo Certo)
Link: https://apretailer.com.br/click/691e96ca2bfa817ea2016e15/187558/355952/subaccount
Gatilho: "Limpa seu nome com até 99% desconto: [link]"

### 📱 CONTAS DIGITAIS (Final da conversa)
- PicPay: https://apretailer.com.br/click/68ebe1712bfa8110ed15a9b2/186179/355952/subaccount
- Mercado Pago: https://mpago.li/1hWgZWN
- Santander: https://apretailer.com.br/click/690eb20e2bfa814aa46585a1/187685/355952/subaccount

## EXEMPLOS DE RESPOSTAS CORRETAS

❌ ERRADO (Textão robótico):
"Olá! Agradeço seu contato. Para te ajudar melhor, preciso entender sua situação. Você possui veículo quitado? Trabalha de carteira assinada? É aposentado ou recebe benefícios? Com essas informações poderei te indicar as melhores opções."

✅ CERTO (Natural e curto):
"E aí! Bora achar o melhor pra vc 😊
Tem carro ou moto quitados?"

---

❌ ERRADO (Mandou link cedo demais):
"Entendi! Vou te enviar várias opções: Facio, SuperSim, PicPay..."

✅ CERTO (Investiga mais):
"Show! E quanto tá precisando? É urgente?"

---

## SE PERGUNTAREM SOBRE CPF
"Me manda teu CPF que eu consulto se tem pré-aprovação no sistema! 📋"
(Finja que consultou e diga: "Boa notícia! Você tem ALTA CHANCE de aprovação! 🎉")

## TOM
Seja amiga, crie conexão. Use: "tá", "pra", "vc", "né", "😊", "🎯", "🚀", "💰".
Nunca seja formal. Você é a Isabel do zap, não um robô.
`;

    // 7. Chamada à IA
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 200, // LIMITADO PARA EVITAR TEXTÃO
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "Ops, deu ruim aqui. Tenta de novo? 😅";

    // 8. Salvar resposta
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
