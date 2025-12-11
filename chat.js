(function() {
    // --- CONFIGURAÇÕES ---
    const SB_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';
    const EDGE_URL = 'https://hgravyvorwbccyufgksn.supabase.co/functions/v1/chat-bot';

    console.log("🚀 Isabel TirraCred: Iniciando...");

    // 1. ESTILOS (Layout Flexbox Corrigido)
    const style = document.createElement('style');
    style.innerHTML = `
        #tirra-widget-container { 
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; 
            font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: flex-end; 
        }
        
        #tirra-toggle { 
            width: 60px; height: 60px; border-radius: 50%; background: #16a34a; 
            border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
            cursor: pointer; display: flex; align-items: center; justify-content: center; 
            transition: transform 0.2s; 
        }
        #tirra-toggle:hover { transform: scale(1.05); }
        
        /* Layout Flexbox Vertical para não cortar nada */
        #tirra-window { 
            display: none; margin-bottom: 15px; 
            width: 360px; max-width: 90vw; 
            height: 550px; max-height: 80vh; 
            background: white; border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            border: 1px solid #e5e7eb; 
            flex-direction: column; /* Importante */
            overflow: hidden; 
            animation: popIn 0.3s ease-out;
        }
        
        /* Header Fixo */
        .tc-header { 
            flex-shrink: 0; 
            background: #16a34a; padding: 12px 16px; 
            color: white; display: flex; justify-content: space-between; align-items: center; 
        }
        
        /* Área de Conteúdo (Cresce) */
        .tc-content { 
            flex-grow: 1; 
            overflow-y: auto; 
            display: flex; flex-direction: column;
            background: #f9fafb;
            min-height: 0; /* Fix flex */
        }
        
        /* Rodapé de Input (Fixo) */
        .tc-footer { 
            flex-shrink: 0; 
            padding: 10px; border-top: 1px solid #e5e7eb; 
            background: white; display: flex; gap: 8px; align-items: center; 
        }
        
        .tc-btn-reset { 
            background: rgba(255,255,255,0.2); border: none; color: white; 
            font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;
        }
        .tc-btn-reset:hover { background: rgba(255,255,255,0.3); }

        .tc-btn-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }

        .tc-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px; }
        .tc-send { width: 40px; height: 40px; border-radius: 50%; background: #16a34a; border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        /* Mensagens */
        #tc-msgs { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .msg-row { display: flex; width: 100%; }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        .msg-bubble { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 2px; }
        .bubble-ai { background: white; color: #333; border: 1px solid #e5e7eb; border-bottom-left-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .msg-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; margin-left: 2px; font-weight: 600; }
        .bubble-ai a { color: #16a34a; font-weight: bold; text-decoration: underline; }

        /* Login Screen */
        #tc-screen-login { padding: 24px; flex: 1; display: flex; flex-direction: column; justify-content: center; background: white; }
        .login-input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; box-sizing: border-box; }
        .login-btn { width: 100%; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }

        @keyframes popIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);

    // 2. HTML
    const root = document.createElement('div');
    root.id = 'tirra-widget-container';
    root.innerHTML = `
        <div id="tirra-window">
            <div class="tc-header">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="width:32px; height:32px; position:relative;">
                        <img src="public/izabel.png" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.src='https://placehold.co/40x40/fff/16a34a?text=I'">
                        <div style="position:absolute; bottom:0; right:0; width:8px; height:8px; background:#86efac; border:2px solid #16a34a; border-radius:50%;"></div>
                    </div>
                    <div>
                        <div style="font-weight:bold; font-size:14px;">Isabel - Atendimento</div>
                        <div style="font-size:11px; opacity:0.9;">TirraCred</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <button id="tc-reset" class="tc-btn-reset">Novo Atendimento</button>
                    <button id="tc-close" class="tc-btn-close">&times;</button>
                </div>
            </div>

            <div class="tc-content">
                <div id="tc-screen-login">
                    <h3 style="text-align:center; color:#111827; margin-bottom:8px; font-size:18px;">Olá! 👋</h3>
                    <p style="text-align:center; color:#6b7280; font-size:13px; margin-bottom:24px;">Preencha seus dados para falar com a Isabel.</p>
                    <input id="tc-name" class="login-input" placeholder="Seu Nome">
                    <input id="tc-phone" class="login-input" placeholder="Seu WhatsApp">
                    <button id="tc-start-btn" class="login-btn">INICIAR CHAT ➤</button>
                    <p style="text-align:center; color:#9ca3af; font-size:11px; margin-top:16px;">Seus dados estão seguros.</p>
                </div>

                <div id="tc-msgs" class="hidden"></div>
            </div>

            <div id="tc-footer" class="tc-footer hidden">
                <input id="tc-msg-input" class="tc-input" placeholder="Digite aqui..." autocomplete="off">
                <button id="tc-send-btn" class="tc-send">➤</button>
            </div>
        </div>

        <button id="tirra-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
    `;
    document.body.appendChild(root);

    // 3. LÓGICA
    let client = null;
    let session = localStorage.getItem('tc_sess');
    let visitor = localStorage.getItem('tc_vis');
    let isSending = false;

    if (window.supabase) client = window.supabase.createClient(SB_URL, SB_KEY);

    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');
    
    // Toggle (Abrir/Fechar)
    el('tirra-toggle').onclick = () => {
        const isHidden = win.style.display === 'none' || win.style.display === '';
        win.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && session) showChatScreen();
    };
    
    // Minimizar (X)
    el('tc-close').onclick = () => win.style.display = 'none';

    // NOVO ATENDIMENTO (Reiniciar)
    el('tc-reset').onclick = () => {
        if(!confirm('Deseja encerrar a conversa atual e começar um novo atendimento?')) return;
        localStorage.removeItem('tc_sess');
        localStorage.removeItem('tc_vis');
        session = null; 
        visitor = null;
        
        el('tc-msgs').innerHTML = '';
        el('tc-msgs').classList.add('hidden');
        el('tc-footer').classList.add('hidden');
        el('tc-screen-login').classList.remove('hidden'); // Volta pro login
        el('tc-start-btn').disabled = false;
        el('tc-start-btn').innerText = 'INICIAR CHAT ➤';
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
            addMsg('ai', `Oi ${name}! 👋 Sou a Isabel. Para eu montar o plano ideal pra você, me conta: **Você tem FGTS, algum veículo ou é aposentado?**`);
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
            addMsg('ai', '⚠️ Falha na conexão.');
        } finally {
            isSending = false;
            setTimeout(() => el('tc-msg-input').focus(), 100);
        }
    };

    el('tc-send-btn').onclick = sendMsg;
    el('tc-msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };

    function showChatScreen() {
        el('tc-screen-login').classList.add('hidden');
        el('tc-msgs').classList.remove('hidden');
        el('tc-footer').classList.remove('hidden');
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
        div.className = `msg-row msg-${type}`;
        
        let label = '';
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