(function() {
    console.log("🚀 Widget TirraCred: Versão Premium (Fade, Sons, Typing)...");

    // --------------------------------------------------------
    // 0. CONFIGURAÇÕES & SONS
    // --------------------------------------------------------
    const SOUND_URL = "https://cdn.freesound.org/previews/536/536108_1415754-lq.mp3"; // Som de "Pop" suave
    const audio = new Audio(SOUND_URL);
    audio.volume = 0.5;

    const playNotification = () => {
        // Tenta tocar o som (navegadores bloqueiam se não houver interação antes, mas ok)
        audio.play().catch(e => console.log("Audio bloqueado pelo browser até interação."));
    };

    // --------------------------------------------------------
    // 1. ESTILOS (CSS) - Animações, Modal e Typing
    // --------------------------------------------------------
    const style = document.createElement('style');
    style.innerHTML = `
        #tirra-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
        
        /* Botão Flutuante */
        #tirra-toggle { pointer-events: auto; width: 60px; height: 60px; border-radius: 50%; background: #16a34a; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        #tirra-toggle:hover { transform: scale(1.1); }
        
        /* Janela Principal */
        #tirra-window { 
            pointer-events: auto;
            display: none; /* Controlado via JS + Classes */
            margin-bottom: 15px; 
            width: 360px; 
            max-width: 90vw; 
            height: 550px; 
            max-height: 80vh; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            flex-direction: column; 
            overflow: hidden; 
            border: 1px solid #e5e7eb; 
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        /* Classes de Animação de Estado */
        #tirra-window.open { display: flex; opacity: 1; transform: translateY(0); }
        #tirra-window.closed { opacity: 0; transform: translateY(20px); pointer-events: none; }

        /* Header */
        .tc-header { flex-shrink: 0; background: #16a34a; padding: 16px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .tc-header-btn { background: none; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 18px; opacity: 0.9; transition: opacity 0.2s; }
        .tc-header-btn:hover { opacity: 1; background: rgba(255,255,255,0.2); border-radius: 4px; }

        /* Telas */
        .tc-screen { flex: 1; display: flex; flex-direction: column; overflow: hidden; height: 100%; position: relative; }
        
        /* Chat Area */
        #tc-msgs { flex: 1; overflow-y: auto; padding: 16px; background: #f9fafb; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
        .tc-footer-input { flex-shrink: 0; padding: 12px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 8px; align-items: center; }
        
        /* Elementos UI */
        .tc-avatar { width: 36px; height: 36px; background: white; border-radius: 50%; padding: 2px; position: relative; }
        .tc-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .tc-status { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #86efac; border: 2px solid #16a34a; border-radius: 50%; }
        .tc-btn { width: 100%; padding: 14px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; transition: background 0.2s; }
        .tc-btn:hover { background: #15803d; }
        .tc-input { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; font-size: 14px; background: #f9fafb; }
        .tc-input:focus { border-color: #16a34a; background: white; }

        /* Balões */
        .msg-row { display: flex; width: 100%; animation: fadeMsg 0.3s ease forwards; }
        @keyframes fadeMsg { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        .msg-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-wrap: break-word; position: relative; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 2px; }
        .bubble-ai { background: #e5e7eb; color: #1f2937; border-bottom-left-radius: 2px; }
        .msg-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; margin-left: 4px; font-weight: 600; }
        .msg-bubble a { color: inherit; text-decoration: underline; font-weight: bold; }
        .bubble-ai a { color: #047857; }

        /* Typing Indicator (...) */
        .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; align-items: center; }
        .typing-dot { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* Modal de Confirmação (Estilo Site) */
        #tc-modal-overlay { 
            display: none; 
            position: absolute; inset: 0; background: rgba(255,255,255,0.95); 
            z-index: 50; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center;
            opacity: 0; transition: opacity 0.2s;
        }
        #tc-modal-overlay.active { display: flex; opacity: 1; }
        .tc-modal-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .tc-modal-desc { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
        .tc-modal-actions { display: flex; gap: 10px; width: 100%; }
        .tc-btn-outline { flex: 1; padding: 10px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .tc-btn-danger { flex: 1; padding: 10px; border: none; background: #dc2626; color: white; border-radius: 8px; cursor: pointer; font-weight: 600; }

    `;
    document.head.appendChild(style);

    // --------------------------------------------------------
    // 2. HTML (Estrutura com Modal e IDs Corretos)
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
                    <button id="tc-close-trigger" class="tc-header-btn" title="Encerrar">&times;</button>
                </div>
            </div>

            <div id="tc-modal-overlay">
                <div style="width: 50px; height: 50px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                </div>
                <div class="tc-modal-title">Encerrar atendimento?</div>
                <div class="tc-modal-desc">Seu histórico de conversa será apagado permanentemente.</div>
                <div class="tc-modal-actions">
                    <button id="tc-modal-cancel" class="tc-btn-outline">Voltar</button>
                    <button id="tc-modal-confirm" class="tc-btn-danger">Encerrar</button>
                </div>
            </div>

            <div id="tc-screen-login" class="tc-screen" style="padding:24px; justify-content:center;">
                <h3 style="text-align:center; color:#111827; margin-bottom:8px;">Falar com a Isabel 👋</h3>
                <p style="text-align:center; color:#6b7280; font-size:13px; margin-bottom:24px;">Informe seus dados para iniciar a triagem.</p>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <input id="tc-name" class="tc-input" placeholder="Seu Nome Completo">
                    <input id="tc-phone" class="tc-input" placeholder="WhatsApp (DDD + Número)">
                    <button id="tc-start-btn" class="tc-btn">INICIAR ATENDIMENTO ➤</button>
                </div>
            </div>

            <div id="tc-screen-chat" class="tc-screen" style="display:none;">
                <div id="tc-msgs"></div>
                <div id="tc-typing-area"></div> <div class="tc-footer-input">
                    <input id="tc-msg-input" class="tc-input" placeholder="Digite sua mensagem aqui..." autocomplete="off">
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
    // 3. LÓGICA DO CLIENTE & UI
    // --------------------------------------------------------
    const SB_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';
    const EDGE_URL = 'https://hgravyvorwbccyufgksn.supabase.co/functions/v1/chat-bot';

    let client = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
    let session = localStorage.getItem('tc_sess');
    let visitor = localStorage.getItem('tc_vis');
    let isSending = false;
    let isChatOpen = false;

    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');

    // --- FUNÇÕES DE CONTROLE DE JANELA (Animações) ---
    const openChat = () => {
        isChatOpen = true;
        win.style.display = 'flex'; // Primeiro torna visível
        // Pequeno delay para permitir a transição CSS
        setTimeout(() => {
            win.classList.add('open');
            win.classList.remove('closed');
        }, 10);
        
        if(session) {
            showChatScreen();
        } else {
            setTimeout(() => el('tc-name')?.focus(), 100);
        }
    };

    const closeChat = () => {
        isChatOpen = false;
        win.classList.remove('open');
        win.classList.add('closed');
        // Espera a animação terminar para dar display none
        setTimeout(() => {
            if(!isChatOpen) win.style.display = 'none';
        }, 300);
    };

    // Toggle Button
    el('tirra-toggle').onclick = () => {
        if (isChatOpen) closeChat();
        else openChat();
    };

    // Botões Externos (Header, Mobile)
    ['btn-chat-header', 'btn-chat-mobile', 'btn-chat-drawer','btn-chat-footer'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = (e) => { e.preventDefault(); openChat(); };
    });

    // Minimizar
    el('tc-minimize').onclick = closeChat;

    // --- MODAL DE ENCERRAMENTO ---
    const modal = el('tc-modal-overlay');
    
    // Abre modal ao clicar no X
    el('tc-close-trigger').onclick = () => {
        modal.classList.add('active');
    };
    // Cancela modal
    el('tc-modal-cancel').onclick = () => {
        modal.classList.remove('active');
    };
    // Confirma encerramento
    el('tc-modal-confirm').onclick = () => {
        localStorage.removeItem('tc_sess');
        localStorage.removeItem('tc_vis');
        session = null; visitor = null;
        el('tc-msgs').innerHTML = '';
        el('tc-name').value = ''; el('tc-phone').value = '';
        
        // UI Reset
        modal.classList.remove('active');
        el('tc-screen-chat').style.display = 'none';
        el('tc-screen-login').style.display = 'flex';
        
        closeChat(); // Fecha com fade
    };

    // --- INDICADOR "DIGITANDO..." ---
    const showTyping = () => {
        const area = el('tc-msgs');
        // Evita duplicatas
        if(area.querySelector('.msg-typing-wrapper')) return;

        const div = document.createElement('div');
        div.className = 'msg-row msg-ai msg-typing-wrapper';
        div.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:flex-start;">
                <div class="msg-label">Isabel</div>
                <div class="msg-bubble bubble-ai typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        area.appendChild(div);
        area.scrollTop = area.scrollHeight;
    };

    const hideTyping = () => {
        const typing = el('tc-msgs').querySelector('.msg-typing-wrapper');
        if(typing) typing.remove();
    };

    // --- LOGIN E START PROATIVO ---
    el('tc-start-btn').onclick = async () => {
        const name = el('tc-name').value;
        const phone = el('tc-phone').value;
        if (!name || !phone) return alert('Preencha os dados.');

        el('tc-start-btn').innerText = 'Conectando...';
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
            
            // Simula Isabel digitando proativamente
            showTyping();
            
            // Disparo Silencioso
            fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
                body: JSON.stringify({ session_id: session, message: '##START##', visitor_name: visitor })
            }).catch(e => console.error("Start error:", e));

        } catch (e) {
            console.error(e);
            alert('Erro ao conectar.');
            el('tc-start-btn').innerText = 'INICIAR ATENDIMENTO ➤';
            el('tc-start-btn').disabled = false;
        }
    };

    function showChatScreen() {
        el('tc-screen-login').style.display = 'none';
        el('tc-screen-chat').style.display = 'flex';
        loadHistory();
        
        // Listener Realtime com Delay
        client.channel('widget_room').on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${session}` }, 
            (payload) => {
                if(payload.new.sender !== 'user') {
                    // Se for mensagem da IA, tratamos o "Digitando..."
                    handleIncomingMessage(payload.new);
                }
            }
        ).subscribe();
    }

    async function loadHistory() {
        if(!session) return;
        const { data } = await client.from('chat_messages').select('*').eq('session_id', session).order('created_at');
        el('tc-msgs').innerHTML = '';
        if(data) data.forEach(m => addMsg(m.sender, m.content, false)); // false = sem som no histórico
    }

    // Lógica de Delay e Digitação para mensagens recebidas
    function handleIncomingMessage(msg) {
        // Se ainda não estiver mostrando typing, mostra agora
        showTyping();
        
        // Aguarda 3 segundos (3000ms) para mostrar a mensagem real
        setTimeout(() => {
            hideTyping();
            addMsg(msg.sender, msg.content, true); // true = toca som
        }, 3000);
    }

    const sendMsg = async () => {
        const txt = el('tc-msg-input').value.trim();
        if(!txt || isSending) return;

        isSending = true;
        el('tc-msg-input').disabled = true;
        addMsg('user', txt, false); // User não tem som
        el('tc-msg-input').value = '';
        
        // Assim que o user envia, já mostramos que a IA vai responder
        showTyping();

        try {
            await fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
                body: JSON.stringify({ session_id: session, message: txt, visitor_name: visitor })
            });
        } catch(e) {
            hideTyping();
            addMsg('ai', '⚠️ Falha na conexão.', false);
        } finally {
            isSending = false;
            el('tc-msg-input').disabled = false;
            el('tc-msg-input').focus();
        }
    };

    el('tc-send-btn').onclick = sendMsg;
    el('tc-msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };

    function addMsg(sender, text, playSound = false) {
        const div = document.createElement('div');
        div.className = `msg-row msg-${sender === 'user' ? 'user' : 'ai'}`;
        
        let label = sender === 'ai' ? '<div class="msg-label">Isabel</div>' : '';

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
        area.scrollTop = area.scrollHeight;

        if(playSound && sender === 'ai') playNotification();
    }

    // --------------------------------------------------------
    // 4. FUNCIONALIDADE DE LINK DIRETO (AUTO-OPEN)
    // --------------------------------------------------------
    // Verifica se a URL tem ?chat=open ou ?chat=fullscreen
    const urlParams = new URLSearchParams(window.location.search);
    const chatMode = urlParams.get('chat');

    if (chatMode === 'open' || chatMode === 'fullscreen') {
        // Abre o chat automaticamente
        openChat();

        // Se for modo fullscreen, aplicamos estilos para parecer um app nativo
        if (chatMode === 'fullscreen') {
            const win = document.getElementById('tirra-window');
            const toggle = document.getElementById('tirra-toggle');
            
            // Estilo para ocupar a tela toda
            win.style.position = 'fixed';
            win.style.bottom = '0';
            win.style.right = '0';
            win.style.width = '100%';
            win.style.height = '100%';
            win.style.maxWidth = '100%';
            win.style.maxHeight = '100%';
            win.style.borderRadius = '0';
            win.style.margin = '0';
            win.style.zIndex = '999999';

            // Esconde o botão de bolinha flutuante
            if(toggle) toggle.style.display = 'none';
            
            // Opcional: Esconder o botão de minimizar para obrigar a ficar na tela
            const minBtn = document.getElementById('tc-minimize');
            if(minBtn) minBtn.style.display = 'none';
        }
    }

})();