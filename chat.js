(function() {
    console.log("🚀 Widget TirraCred: Iniciando Versão Otimizada...");

    // --------------------------------------------------------
    // 1. ESTILOS (CSS CORRIGIDO E TRAVADO)
    // --------------------------------------------------------
    const style = document.createElement('style');
    style.innerHTML = `
        #tirra-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: flex-end; }
        
        /* Botão Flutuante */
        #tirra-toggle { width: 60px; height: 60px; border-radius: 50%; background: #16a34a; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        #tirra-toggle:hover { transform: scale(1.1); }
        
        /* Janela Principal - FLEXBOX CORRIGIDO */
        #tirra-window { 
            display: none; 
            margin-bottom: 15px; 
            width: 360px; 
            max-width: 90vw; 
            height: 550px; 
            max-height: 80vh; /* Segurança para mobile */
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            flex-direction: column; /* Essencial */
            overflow: hidden; 
            border: 1px solid #e5e7eb; 
            animation: popIn 0.3s ease-out; 
        }
        
        /* Header - Fixo no topo */
        .tc-header { 
            flex-shrink: 0; /* Não encolhe */
            background: #16a34a; 
            padding: 16px; 
            color: white; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        
        /* Área de Conteúdo (Telas) */
        .tc-screen {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden; /* O scroll vai dentro dos filhos */
            height: 100%;
        }

        /* Área de Mensagens - Com Scroll */
        #tc-msgs { 
            flex: 1; /* Ocupa todo o espaço disponível */
            overflow-y: auto; /* Scroll só aqui */
            padding: 16px; 
            background: #f9fafb; 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            scroll-behavior: smooth; 
        }

        /* Área do Input - Fixa embaixo */
        .tc-footer-input {
            flex-shrink: 0; /* Não encolhe */
            padding: 12px; 
            border-top: 1px solid #e5e7eb; 
            background: white; 
            display: flex; 
            gap: 8px; 
            align-items: center; 
        }

        /* Elementos Gerais */
        .tc-avatar { width: 36px; height: 36px; background: white; border-radius: 50%; padding: 2px; position: relative; }
        .tc-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .tc-status { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #86efac; border: 2px solid #16a34a; border-radius: 50%; }
        
        .tc-btn { width: 100%; padding: 14px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; transition: background 0.2s; }
        .tc-btn:hover { background: #15803d; }
        .tc-btn:disabled { background: #86efac; opacity: 0.8; }
        
        .tc-input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; font-size: 14px; background: #f9fafb; }
        .tc-input:focus { border-color: #16a34a; background: white; }

        /* Balões de Mensagem */
        .msg-row { display: flex; width: 100%; }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        .msg-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-wrap: break-word; position: relative; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 2px; }
        .bubble-ai { background: #e5e7eb; color: #1f2937; border-bottom-left-radius: 2px; }
        .msg-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; margin-left: 4px; font-weight: 600; }
        
        .msg-bubble a { color: inherit; text-decoration: underline; font-weight: bold; }
        .bubble-ai a { color: #047857; }

        /* Botões do Header */
        .tc-header-btn { background: none; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 18px; opacity: 0.9; transition: opacity 0.2s; }
        .tc-header-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); border-radius: 4px; }

        @keyframes popIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    document.head.appendChild(style);

    // --------------------------------------------------------
    // 2. HTML (Minimizar e Encerrar Adicionados)
    // --------------------------------------------------------
    const root = document.createElement('div');
    root.id = 'tirra-widget-container';
    root.innerHTML = `
        <div id="tirra-window">
            <div class="tc-header">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div class="tc-avatar">
                        <img src="public/izabel.png" onerror="this.src='https://placehold.co/40x40/fff/16a34a?text=I'">
                        <div class="tc-status"></div>
                    </div>
                    <div>
                        <div style="font-weight:bold; font-size:15px;">Isabel - Crédito</div>
                        <div style="font-size:12px; opacity:0.9;">Online ⚡</div>
                    </div>
                </div>
                <div>
                    <button id="tc-minimize" class="tc-header-btn" title="Minimizar">_</button>
                    <button id="tc-close" class="tc-header-btn" title="Encerrar Atendimento">&times;</button>
                </div>
            </div>

            <div id="tc-screen-login" class="tc-screen" style="padding:24px; justify-content:center;">
                <h3 style="text-align:center; color:#111827; margin-bottom:8px;">Falar com a Isabel 👋</h3>
                <p style="text-align:center; color:#6b7280; font-size:13px; margin-bottom:24px;">Informe seus dados para iniciar a triagem de crédito.</p>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <input id="tc-name" class="tc-input" placeholder="Seu Nome Completo">
                    <input id="tc-phone" class="tc-input" placeholder="WhatsApp (DDD + Número)">
                    <button id="tc-start-btn" class="tc-btn">INICIAR ATENDIMENTO ➤</button>
                </div>
            </div>

            <div id="tc-screen-chat" class="tc-screen" style="display:none;">
                <div id="tc-msgs"></div>
                <div class="tc-footer-input">
                    <input id="tc-msg-input" class="tc-input" placeholder="Digite sua resposta..." autocomplete="off">
                    <button id="tc-send-btn" style="width:46px; height:46px; border-radius:8px; background:#16a34a; border:none; color:white; cursor:pointer;">➤</button>
                </div>
            </div>
        </div>

        <button id="tirra-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
    `;
    document.body.appendChild(root);

    // --------------------------------------------------------
    // 3. LÓGICA DO CLIENTE
    // --------------------------------------------------------
    
    // CONFIGURAÇÃO SUPABASE
    const SB_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';
    const EDGE_URL = 'https://hgravyvorwbccyufgksn.supabase.co/functions/v1/chat-bot';

    let client = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
    let session = localStorage.getItem('tc_sess');
    let visitor = localStorage.getItem('tc_vis');
    let isSending = false;

    // Elementos
    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');
    
    // --- CONTROLES DA JANELA ---
    
    // Toggle (Abrir/Fechar)
    el('tirra-toggle').onclick = () => {
        const isClosed = win.style.display === 'none' || win.style.display === '';
        win.style.display = isClosed ? 'flex' : 'none';
        if (isClosed && session) showChatScreen();
    };
// --- 4. GATILHOS EXTERNOS (Footer e Menu) ---
    // Lista de IDs dos botões no seu site que devem abrir o chat
    ['btn-chat-footer', 'btn-chat-mobile'].forEach(btnID => {
        const btn = document.getElementById(btnID);
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault(); // Impede o link de navegar
                // Abre a janela
                win.style.display = 'flex';
                // Se já tiver sessão, carrega o chat direto
                if (session) showChatScreen();
            };
        }
    });
    // Minimizar (Apenas esconde)
    el('tc-minimize').onclick = () => {
        win.style.display = 'none';
    };

    // Encerrar Atendimento (Reseta Tudo)
    el('tc-close').onclick = () => {
        if(confirm("Deseja encerrar o atendimento e apagar o histórico?")) {
            localStorage.removeItem('tc_sess');
            localStorage.removeItem('tc_vis');
            session = null;
            visitor = null;
            el('tc-msgs').innerHTML = ''; // Limpa visual
            el('tc-name').value = '';
            el('tc-phone').value = '';
            
            // Volta pro login
            el('tc-screen-chat').style.display = 'none';
            el('tc-screen-login').style.display = 'flex';
        }
    };

    // --- LOGIN ---
    el('tc-start-btn').onclick = async () => {
        const name = el('tc-name').value;
        const phone = el('tc-phone').value;
        if (!name || !phone) return alert('Preencha nome e WhatsApp.');

        el('tc-start-btn').innerText = 'Iniciando...';
        el('tc-start-btn').disabled = true;

        try {
            if(!client) throw new Error("Supabase off");
            const { data, error } = await client.from('chat_sessions')
                .insert({ visitor_name: name, visitor_phone: phone }).select().single();
            if (error) throw error;

            session = data.id;
            visitor = name;
            localStorage.setItem('tc_sess', session);
            localStorage.setItem('tc_vis', name);
            
            showChatScreen();
            addMsg('ai', `Oi ${name}! 👋 Sou a Isabel. Para eu conseguir a melhor taxa pra você, me conta: **Seu nome está negativado ou limpo?**`);
        } catch (e) {
            console.error(e);
            alert('Erro ao conectar.');
        } finally {
            el('tc-start-btn').innerText = 'INICIAR ATENDIMENTO ➤';
            el('tc-start-btn').disabled = false;
        }
    };

    // --- CHAT LOGIC ---
    function showChatScreen() {
        el('tc-screen-login').style.display = 'none';
        el('tc-screen-chat').style.display = 'flex'; // Flex para manter estrutura
        loadHistory();
        
        // Realtime Subscription
        client.channel('widget_room').on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${session}` }, 
            (payload) => {
                if(payload.new.sender !== 'user') addMsg(payload.new.sender, payload.new.content);
            }
        ).subscribe();
    }

    async function loadHistory() {
        if(!session) return;
        const { data } = await client.from('chat_messages').select('*').eq('session_id', session).order('created_at');
        el('tc-msgs').innerHTML = '';
        if(data) data.forEach(m => addMsg(m.sender, m.content));
    }

    const sendMsg = async () => {
        const txt = el('tc-msg-input').value.trim();
        if(!txt || isSending) return;

        isSending = true;
        el('tc-msg-input').disabled = true;
        addMsg('user', txt);
        el('tc-msg-input').value = '';

        try {
            await fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
                body: JSON.stringify({ session_id: session, message: txt, visitor_name: visitor })
            });
        } catch(e) {
            addMsg('ai', '⚠️ Falha na conexão. Tente novamente.');
        } finally {
            isSending = false;
            el('tc-msg-input').disabled = false;
            el('tc-msg-input').focus();
        }
    };

    el('tc-send-btn').onclick = sendMsg;
    el('tc-msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };

    function addMsg(sender, text) {
        const div = document.createElement('div');
        div.className = `msg-row msg-${sender === 'user' ? 'user' : 'ai'}`;
        
        let label = sender === 'ai' ? '<div class="msg-label">Isabel</div>' : '';
        
        // Formata link e negrito
        const processedText = text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">CLIQUE AQUI 🔗</a>')
            .replace(/\n/g, '<br>');

        div.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:${sender === 'user' ? 'flex-end' : 'flex-start'}; width:100%;">
                ${label}
                <div class="msg-bubble bubble-${sender === 'user' ? 'user' : 'ai'}">${processedText}</div>
            </div>
        `;
        
        const area = el('tc-msgs');
        area.appendChild(div);
        area.scrollTop = area.scrollHeight; // Rola pro fundo
    }
    
})();