(function() {
    console.log("🚀 Widget TirraCred: Iniciando...");

    // 1. ESTILOS
    const style = document.createElement('style');
    style.innerHTML = `
        #tirra-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: flex-end; }
        
        #tirra-toggle { width: 60px; height: 60px; border-radius: 50%; background: #16a34a; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        #tirra-toggle:hover { transform: scale(1.1); }
        
        #tirra-window { display: none; margin-bottom: 15px; width: 360px; max-width: 90vw; height: 550px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; border: 1px solid #e5e7eb; animation: popIn 0.3s ease-out; }
        
        .tc-header { background: #16a34a; padding: 16px; color: white; display: flex; justify-content: space-between; align-items: center; }
        
        /* Botões do Header */
        .tc-header-actions { display: flex; gap: 10px; }
        .tc-header-btn { background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 4px; opacity: 0.8; transition: opacity 0.2s; }
        .tc-header-btn:hover { opacity: 1; }
        
        .tc-btn { width: 100%; padding: 14px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 15px; }
        .tc-btn:disabled { background: #86efac; cursor: not-allowed; }
        
        .tc-input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; box-sizing: border-box; outline: none; font-size: 14px; background: #f9fafb; }
        .tc-input:focus { border-color: #16a34a; background: white; }

        #tc-msgs { flex: 1; overflow-y: auto; padding: 16px; background: #ffffff; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
        
        .msg-row { display: flex; width: 100%; }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        
        .msg-bubble { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); position: relative; word-wrap: break-word; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 4px; }
        .bubble-ai { background: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px; }
        .bubble-admin { background: #2563eb; color: white; border-bottom-left-radius: 4px; }
        
        .msg-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; margin-left: 4px; font-weight: 600; }
        .msg-bubble a { color: inherit; text-decoration: underline; font-weight: bold; }
        
        @keyframes popIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    document.head.appendChild(style);

    // 2. HTML
    const root = document.createElement('div');
    root.id = 'tirra-widget-container';
    root.innerHTML = `
        <div id="tirra-window">
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
                    <button id="tc-reset" class="tc-header-btn" title="Encerrar Atendimento">🔄</button>
                    <button id="tc-close" class="tc-header-btn" title="Minimizar">&times;</button>
                </div>
            </div>

            <div id="tc-screen-login" style="padding:24px; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <h3 style="text-align:center; color:#111827; margin-bottom:8px; font-size:18px;">Falar com a Isabel 👋</h3>
                <p style="text-align:center; color:#6b7280; font-size:14px; margin-bottom:24px;">Preencha seus dados para receber atendimento especializado.</p>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <input id="tc-name" class="tc-input" placeholder="Seu Nome Completo">
                    <input id="tc-phone" class="tc-input" placeholder="Seu WhatsApp (DDD + Número)">
                    <button id="tc-start-btn" class="tc-btn">INICIAR ATENDIMENTO ➤</button>
                </div>
                <p style="text-align:center; color:#9ca3af; font-size:11px; margin-top:16px;">Seus dados estão 100% seguros.</p>
            </div>

            <div id="tc-screen-chat" style="display:none; flex:1; flex-direction:column; height:100%; background:#fff;">
                <div id="tc-msgs"></div>
                <div style="padding:16px; border-top:1px solid #f3f4f6; display:flex; gap:10px; background:white; align-items:center;">
                    <input id="tc-msg-input" class="tc-input" style="margin:0;" placeholder="Digite sua resposta..." autocomplete="off">
                    <button id="tc-send-btn" style="width:46px; height:46px; border-radius:12px; background:#16a34a; border:none; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(22,163,74,0.3);">➤</button>
                </div>
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

    if (window.supabase) {
        client = window.supabase.createClient(SB_URL, SB_KEY);
    } else {
        console.error("Supabase SDK não carregado.");
    }

    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');
    const input = el('tc-msg-input');
    const sendBtn = el('tc-send-btn');

    // Toggle (Abrir/Fechar)
    el('tirra-toggle').onclick = () => {
        const isClosed = win.style.display === 'none' || win.style.display === '';
        win.style.display = isClosed ? 'flex' : 'none';
        if (isClosed) {
            if(session) showChatScreen();
            else setTimeout(() => el('tc-name').focus(), 100);
        }
    };
    
    // Minimizar (X)
    el('tc-close').onclick = () => win.style.display = 'none';

    // RESETAR / ENCERRAR (NOVO)
    el('tc-reset').onclick = () => {
        if(!confirm('Deseja encerrar este atendimento e iniciar um novo?')) return;
        
        // Limpa tudo
        localStorage.removeItem('tc_sess');
        localStorage.removeItem('tc_vis');
        session = null;
        visitor = null;
        
        // Reseta UI
        el('tc-msgs').innerHTML = '';
        el('tc-screen-chat').style.display = 'none';
        el('tc-screen-login').style.display = 'flex';
        el('tc-name').value = '';
        el('tc-phone').value = '';
        el('tc-start-btn').disabled = false;
        el('tc-start-btn').innerText = 'INICIAR ATENDIMENTO ➤';
    };

    // Login
    el('tc-start-btn').onclick = async () => {
        const name = el('tc-name').value;
        const phone = el('tc-phone').value;
        if (!name || !phone) return alert('Por favor, preencha todos os campos.');

        el('tc-start-btn').innerText = 'Conectando...';
        el('tc-start-btn').disabled = true;

        try {
            const { data, error } = await client.from('chat_sessions').insert({ visitor_name: name, visitor_phone: phone }).select().single();
            if (error) throw error;

            session = data.id;
            visitor = name;
            localStorage.setItem('tc_sess', session);
            localStorage.setItem('tc_vis', name);
            
            showChatScreen();
            addMsg('ai', `Oi ${name}! 👋 Aqui é a Isabel. Para eu liberar o melhor crédito pra você agora, me diz: **Você está negativado ou com o nome limpo?**`);
        } catch (e) {
            alert('Erro de conexão. Verifique sua internet.');
            el('tc-start-btn').innerText = 'TENTAR NOVAMENTE';
            el('tc-start-btn').disabled = false;
        }
    };

    const sendMsg = async () => {
        const txt = input.value.trim();
        if(!txt || isSending) return;

        isSending = true;
        input.disabled = true;
        sendBtn.style.opacity = '0.5';
        
        input.value = '';
        addMsg('user', txt);

        try {
            await fetch(EDGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + SB_KEY
                },
                body: JSON.stringify({ session_id: session, message: txt, visitor_name: visitor })
            });
        } catch(e) {
            console.error(e);
            addMsg('ai', '⚠️ Ops, minha conexão falhou. Tente enviar novamente.');
        } finally {
            isSending = false;
            input.disabled = false;
            sendBtn.style.opacity = '1';
            input.focus(); 
        }
    };

    sendBtn.onclick = sendMsg;
    input.onkeypress = (e) => { 
        if(e.key === 'Enter') {
            e.preventDefault(); 
            sendMsg(); 
        }
    };

    function showChatScreen() {
        el('tc-screen-login').style.display = 'none';
        el('tc-screen-chat').style.display = 'flex';
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
        
        let label = '';
        if(sender === 'admin') label = '<div class="msg-label">Atendente Humano</div>';
        if(sender === 'ai') label = '<div class="msg-label">Isabel</div>';

        const processedText = text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') 
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>') 
            .replace(/\n/g, '<br>'); 

        div.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:${sender === 'user' ? 'flex-end' : 'flex-start'}; max-width:100%;">
                ${label}
                <div class="msg-bubble bubble-${type}">${processedText}</div>
            </div>
        `;
        
        const area = el('tc-msgs');
        area.appendChild(div);
        area.scrollTop = area.scrollHeight;
    }
    
})();