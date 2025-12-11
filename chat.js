(function() {
    console.log("🚀 Widget TirraCred: Iniciando...");

    // 1. ESTILOS (CSS CORRIGIDO PARA NÃO QUEBRAR LAYOUT)
    const style = document.createElement('style');
    style.innerHTML = `
        /* Container Principal */
        #tirra-widget-container { 
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; 
            font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: flex-end; 
        }
        
        /* Botão Flutuante */
        #tirra-toggle { 
            width: 60px; height: 60px; border-radius: 50%; background: #16a34a; 
            border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
            cursor: pointer; display: flex; align-items: center; justify-content: center; 
            transition: all 0.2s; 
        }
        #tirra-toggle:hover { transform: scale(1.1); }
        
        /* Janela do Chat (FIXED LAYOUT) */
        #tirra-window { 
            display: none; margin-bottom: 15px; 
            width: 360px; max-width: 90vw; 
            height: 550px; max-height: 80vh; /* Respeita tela pequena */
            background: white; border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            border: 1px solid #e5e7eb; 
            display: flex; flex-direction: column; /* Organiza em coluna */
            overflow: hidden; 
            animation: popIn 0.3s ease-out;
        }
        
        /* SEÇÕES DO LAYOUT */
        /* 1. Topo: Fixo */
        .tc-header { 
            flex-shrink: 0; /* Não encolhe */
            background: #16a34a; padding: 16px; color: white; 
            display: flex; justify-content: space-between; align-items: center; 
        }
        
        /* 2. Conteúdo (Login/Chat): Expande */
        .tc-content-area {
            flex-grow: 1; /* Ocupa todo espaço disponível */
            overflow-y: auto; /* Scroll só aqui */
            background: #f9fafb;
            display: flex; flex-direction: column;
            min-height: 0; /* Fix para Firefox/Flex */
        }

        /* 3. Rodapé (Input): Fixo */
        .tc-footer {
            flex-shrink: 0; /* Não encolhe */
            padding: 12px; border-top: 1px solid #e5e7eb; 
            display: flex; gap: 8px; background: white; align-items: center;
        }
        
        /* Elementos Visuais */
        .tc-header-actions { display: flex; gap: 10px; }
        .tc-header-btn { background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 4px; opacity: 0.8; }
        .tc-header-btn:hover { opacity: 1; }
        
        .tc-btn { width: 100%; padding: 14px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        .tc-input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; box-sizing: border-box; outline: none; background: #fff; }
        .tc-input:focus { border-color: #16a34a; }

        /* Mensagens */
        #tc-msgs { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .msg-row { display: flex; width: 100%; }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        .msg-bubble { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); word-wrap: break-word; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 4px; }
        .bubble-ai { background: #fff; color: #1f2937; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; }
        .msg-bubble a { color: inherit; text-decoration: underline; font-weight: bold; }
        .bubble-ai a { color: #16a34a; }

        /* Helpers */
        .hidden { display: none !important; }
        .flex { display: flex !important; }
        
        @keyframes popIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    document.head.appendChild(style);

    // 2. HTML ESTRUTURADO
    const root = document.createElement('div');
    root.id = 'tirra-widget-container';
    root.innerHTML = `
        <div id="tirra-window" class="hidden">
            <div class="tc-header">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div style="width:36px; height:36px; position:relative;">
                        <img src="public/izabel.png" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.src='https://placehold.co/40x40/fff/16a34a?text=I'">
                        <div style="position:absolute; bottom:0; right:0; width:10px; height:10px; background:#86efac; border:2px solid #16a34a; border-radius:50%;"></div>
                    </div>
                    <div>
                        <div style="font-weight:bold; font-size:14px;">Isabel - Atendimento</div>
                        <div style="font-size:11px; opacity:0.9;">Online agora ⚡</div>
                    </div>
                </div>
                <div class="tc-header-actions">
                    <button id="tc-reset" class="tc-header-btn" title="Reiniciar">🔄</button>
                    <button id="tc-close" class="tc-header-btn" title="Fechar">&times;</button>
                </div>
            </div>

            <div id="tc-screen-login" class="tc-content-area" style="padding:24px; justify-content:center;">
                <h3 style="text-align:center; color:#111827; margin-bottom:8px; font-size:18px;">Falar com a Isabel 👋</h3>
                <p style="text-align:center; color:#6b7280; font-size:14px; margin-bottom:24px;">Preencha seus dados para iniciar.</p>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <input id="tc-name" class="tc-input" placeholder="Seu Nome Completo">
                    <input id="tc-phone" class="tc-input" placeholder="Seu WhatsApp">
                    <button id="tc-start-btn" class="tc-btn">INICIAR ATENDIMENTO ➤</button>
                </div>
            </div>

            <div id="tc-screen-chat" class="tc-content-area hidden">
                <div id="tc-msgs"></div>
            </div>

            <div id="tc-chat-footer" class="tc-footer hidden">
                <input id="tc-msg-input" class="tc-input" style="margin:0;" placeholder="Digite sua resposta..." autocomplete="off">
                <button id="tc-send-btn" style="width:46px; height:46px; border-radius:8px; background:#16a34a; border:none; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;">➤</button>
            </div>
        </div>

        <button id="tirra-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
    `;
    document.body.appendChild(root);

    // 3. LÓGICA
    const SB_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';
    const EDGE_URL = 'https://hgravyvorwbccyufgksn.supabase.co/functions/v1/chat-bot';

    let client = null;
    let session = localStorage.getItem('tc_sess');
    let visitor = localStorage.getItem('tc_vis');
    let isSending = false;

    if (window.supabase) client = window.supabase.createClient(SB_URL, SB_KEY);

    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');
    
    // Toggle
    el('tirra-toggle').onclick = () => {
        const isHidden = win.classList.contains('hidden');
        if (isHidden) {
            win.classList.remove('hidden');
            win.style.display = 'flex'; // Força flex
            if (session) showChatScreen();
        } else {
            win.classList.add('hidden');
            win.style.display = 'none';
        }
    };
    
    el('tc-close').onclick = () => { win.classList.add('hidden'); win.style.display = 'none'; };

    // Reset
    el('tc-reset').onclick = () => {
        if(!confirm('Reiniciar atendimento?')) return;
        localStorage.removeItem('tc_sess');
        localStorage.removeItem('tc_vis');
        session = null; visitor = null;
        el('tc-msgs').innerHTML = '';
        el('tc-screen-chat').classList.add('hidden');
        el('tc-chat-footer').classList.add('hidden');
        el('tc-screen-login').classList.remove('hidden');
        el('tc-start-btn').disabled = false;
        el('tc-start-btn').innerText = 'INICIAR ATENDIMENTO ➤';
    };

    // Login
    el('tc-start-btn').onclick = async () => {
        const name = el('tc-name').value;
        const phone = el('tc-phone').value;
        if (!name || !phone) return alert('Preencha todos os campos.');

        el('tc-start-btn').innerText = 'Conectando...';
        el('tc-start-btn').disabled = true;

        try {
            const { data, error } = await client.from('chat_sessions').insert({ visitor_name: name, visitor_phone: phone }).select().single();
            if (error) throw error;
            session = data.id; visitor = name;
            localStorage.setItem('tc_sess', session);
            localStorage.setItem('tc_vis', name);
            showChatScreen();
            addMsg('ai', `Oi ${name}! 👋 Aqui é a Isabel. Para eu liberar o melhor crédito pra você agora, me diz: **Você está negativado ou com o nome limpo?**`);
        } catch (e) {
            alert('Erro de conexão.');
            el('tc-start-btn').innerText = 'TENTAR NOVAMENTE';
            el('tc-start-btn').disabled = false;
        }
    };

    // Enviar
    const sendMsg = async () => {
        const txt = el('tc-msg-input').value.trim();
        if(!txt || isSending) return;

        isSending = true;
        el('tc-msg-input').value = '';
        addMsg('user', txt);

        try {
            await fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
                body: JSON.stringify({ session_id: session, message: txt, visitor_name: visitor })
            });
        } catch(e) {
            addMsg('ai', '⚠️ Erro de conexão.');
        } finally {
            isSending = false;
            setTimeout(() => el('tc-msg-input').focus(), 100);
        }
    };

    el('tc-send-btn').onclick = sendMsg;
    el('tc-msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };

    function showChatScreen() {
        el('tc-screen-login').classList.add('hidden');
        el('tc-screen-chat').classList.remove('hidden');
        el('tc-chat-footer').classList.remove('hidden');
        loadHistory();
        
        client.channel('widget_room').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${session}` }, 
        (payload) => {
            if(payload.new.sender !== 'user') addMsg(payload.new.sender, payload.new.content);
        }).subscribe();
    }

    async function loadHistory() {
        const { data } = await client.from('chat_messages').select('*').eq('session_id', session).order('created_at');
        el('tc-msgs').innerHTML = '';
        if(data) data.forEach(m => addMsg(m.sender, m.content));
    }

    function addMsg(sender, text) {
        const div = document.createElement('div');
        const type = sender === 'user' ? 'user' : (sender === 'admin' ? 'admin' : 'ai');
        div.className = `msg-row msg-${sender === 'user' ? 'user' : 'ai'}`;
        
        const processedText = text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') 
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>') 
            .replace(/\n/g, '<br>'); 

        div.innerHTML = `<div class="msg-bubble bubble-${type}">${processedText}</div>`;
        const area = el('tc-msgs');
        area.appendChild(div);
        area.scrollTop = area.scrollHeight;
    }
    
})();