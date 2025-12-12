(function() {
    console.log("🚀 Widget TirraCred: Versão Final Corrigida");

    // --------------------------------------------------------
    // SOM FUNCIONAL (MP3 de notificação curto)
    // --------------------------------------------------------
    const audioSrc = "data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm////////////////////////////////////////AAAA5UxhdmM1OC45MQAAAAAAAAAAAAAAACQCgAAAAAAAAAOEfxi0HQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
    const notificationSound = new Audio(audioSrc);
    notificationSound.volume = 0.7;
    let audioUnlocked = false;

    const unlockAudio = () => {
        if (!audioUnlocked) {
            notificationSound.play().then(() => {
                notificationSound.pause();
                notificationSound.currentTime = 0;
                audioUnlocked = true;
                console.log("✅ Áudio desbloqueado");
            }).catch(() => {});
        }
    };

    // --------------------------------------------------------
    // CSS OTIMIZADO (Fix Mobile Completo)
    // --------------------------------------------------------
    const style = document.createElement('style');
    style.innerHTML = `
        /* CORREÇÃO: Meta viewport no HEAD (adicione no HTML principal) */
        /* <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, interactive-widget=resizes-content"> */

        #tirra-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
        
        #tirra-toggle { pointer-events: auto; width: 60px; height: 60px; border-radius: 50%; background: #16a34a; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        #tirra-toggle:hover { transform: scale(1.1); }
        
        #tirra-window { 
            pointer-events: auto;
            display: none; 
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

        #tirra-window.open { display: flex; opacity: 1; transform: translateY(0); }
        #tirra-window.closed { opacity: 0; transform: translateY(20px); pointer-events: none; }

        .tc-header { flex-shrink: 0; background: #16a34a; padding: 16px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .tc-header-btn { background: none; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 18px; opacity: 0.9; transition: opacity 0.2s; }
        
        .tc-screen { flex: 1; display: flex; flex-direction: column; overflow: hidden; height: 100%; position: relative; }
        
        /* FIX: Área de mensagens sem influência do teclado */
        #tc-msgs { 
            flex: 1; 
            overflow-y: auto; 
            padding: 16px; 
            background: #f9fafb; 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            scroll-behavior: smooth; 
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain; /* IMPEDE BOUNCE SCROLL */
        }
        
        /* FIX MOBILE: Input sempre 16px + sem zoom */
        .tc-footer-input { 
            flex-shrink: 0; 
            padding: 12px; 
            border-top: 1px solid #e5e7eb; 
            background: white; 
            display: flex; 
            gap: 8px; 
            align-items: center;
            position: relative; /* Garante que não "flutue" */
        }
        .tc-input { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            outline: none; 
            font-size: 16px !important; /* FORÇA 16px SEMPRE */
            background: #f9fafb;
            touch-action: manipulation; /* Previne gestos extras */
        }
        .tc-input:focus { border-color: #16a34a; background: white; }

        .tc-avatar { width: 36px; height: 36px; background: white; border-radius: 50%; padding: 2px; position: relative; }
        .tc-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .tc-status { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #86efac; border: 2px solid #16a34a; border-radius: 50%; }
        .tc-btn { width: 100%; padding: 14px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 16px; }
        
        .msg-row { display: flex; width: 100%; animation: fadeMsg 0.3s ease forwards; }
        @keyframes fadeMsg { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        .msg-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 15px; line-height: 1.4; word-wrap: break-word; position: relative; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 2px; }
        .bubble-ai { background: #e5e7eb; color: #1f2937; border-bottom-left-radius: 2px; }
        .msg-label { font-size: 11px; color: #6b7280; margin-bottom: 2px; margin-left: 4px; font-weight: 600; }
        .msg-bubble a { color: inherit; text-decoration: underline; font-weight: bold; }
        .bubble-ai a { color: #047857; }

        .typing-indicator { display: flex; gap: 4px; padding: 12px 16px; background: #e5e7eb; border-radius: 12px; border-bottom-left-radius: 2px; width: fit-content; }
        .typing-dot { width: 6px; height: 6px; background: #6b7280; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        #tc-modal-overlay { display: none; position: absolute; inset: 0; background: rgba(255,255,255,0.98); z-index: 50; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; opacity: 0; transition: opacity 0.2s; }
        #tc-modal-overlay.active { display: flex; opacity: 1; }
        .tc-modal-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .tc-modal-actions { display: flex; gap: 10px; width: 100%; margin-top: 15px; }
        .tc-btn-outline { flex: 1; padding: 10px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .tc-btn-danger { flex: 1; padding: 10px; border: none; background: #dc2626; color: white; border-radius: 8px; cursor: pointer; font-weight: 600; }

        /* MOBILE: Tela cheia + bloqueia scroll do body */
        @media (max-width: 480px) {
            body.tc-no-scroll { 
                overflow: hidden !important; 
                position: fixed !important; 
                width: 100% !important;
                height: 100% !important;
            }
            
            #tirra-widget-container { bottom: 0; right: 0; width: 100%; height: 100%; align-items: center; justify-content: flex-end; z-index: 999999; }
            #tirra-window { 
                width: 100% !important; 
                max-width: 100% !important; 
                height: 100% !important; 
                max-height: 100% !important; 
                border-radius: 0; 
                margin-bottom: 0; 
                position: fixed !important; 
                top: 0 !important; 
                left: 0 !important; 
            }
            #tirra-toggle { margin-bottom: 20px; margin-right: 20px; }
            #tirra-window.open ~ #tirra-toggle { display: none; }
        }
    `;
    document.head.appendChild(style);

    // Adiciona meta viewport se não existir
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, interactive-widget=resizes-content';
        document.head.appendChild(meta);
    }

    // --------------------------------------------------------
    // HTML
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
                <div style="font-size:14px; color:#6b7280;">Seu histórico será apagado.</div>
                <div class="tc-modal-actions">
                    <button id="tc-modal-cancel" class="tc-btn-outline">Voltar</button>
                    <button id="tc-modal-confirm" class="tc-btn-danger">Encerrar</button>
                </div>
            </div>

            <div id="tc-screen-login" class="tc-screen" style="padding:24px; justify-content:center;">
                <h3 style="text-align:center; color:#111827; margin-bottom:8px;">Falar com a Isabel 👋</h3>
                <p style="text-align:center; color:#6b7280; font-size:13px; margin-bottom:24px;">Informe seus dados para iniciar.</p>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <input id="tc-name" class="tc-input" placeholder="Seu Nome Completo" autocomplete="name">
                    <input id="tc-phone" class="tc-input" placeholder="WhatsApp (DDD + Número)" autocomplete="tel">
                    <button id="tc-start-btn" class="tc-btn">INICIAR ATENDIMENTO ➤</button>
                </div>
            </div>

            <div id="tc-screen-chat" class="tc-screen" style="display:none;">
                <div id="tc-msgs"></div>
                <div id="typing-container" style="display:none; padding: 0 16px 16px 16px;">
                    <div class="msg-label" style="margin-bottom:4px;">Isabel está digitando...</div>
                    <div class="typing-indicator">
                        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                    </div>
                </div>
                <div class="tc-footer-input">
                    <input id="tc-msg-input" class="tc-input" placeholder="Digite sua resposta..." autocomplete="off">
                    <button id="tc-send-btn" style="width:46px; height:46px; border-radius:8px; background:#16a34a; border:none; color:white; cursor:pointer; flex-shrink:0;">➤</button>
                </div>
            </div>
        </div>

        <button id="tirra-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
    `;
    document.body.appendChild(root);

    // --------------------------------------------------------
    // LÓGICA (CORRIGIDO)
    // --------------------------------------------------------
    const SB_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';
    const EDGE_URL = 'https://hgravyvorwbccyufgksn.supabase.co/functions/v1/chat-bot';

    let client = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
    let session = localStorage.getItem('tc_sess');
    let visitor = localStorage.getItem('tc_vis');
    let isSending = false;
    let isChatOpen = false;
    let realtimeChannel = null; // Controla o canal único

    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');
    const msgsArea = el('tc-msgs');
    const typingArea = el('typing-container');

    // FIX: Controle de scroll no body (mobile)
    const toggleBodyScroll = (lock) => {
        if (window.innerWidth <= 480) {
            if (lock) {
                document.body.classList.add('tc-no-scroll');
            } else {
                document.body.classList.remove('tc-no-scroll');
            }
        }
    };

    const openChat = () => {
        unlockAudio();
        isChatOpen = true;
        win.style.display = 'flex';
        toggleBodyScroll(true);
        
        setTimeout(() => {
            win.classList.add('open');
            win.classList.remove('closed');
        }, 10);
        
        // FIX: Sempre destrava o input ao abrir
        el('tc-msg-input').disabled = false;
        isSending = false;
        
        if (session) {
            showChatScreen();
        } else {
            setTimeout(() => el('tc-name')?.focus(), 100);
        }
    };

    const closeChat = () => {
        isChatOpen = false;
        win.classList.remove('open');
        win.classList.add('closed');
        toggleBodyScroll(false);
        setTimeout(() => {
            if (!isChatOpen) win.style.display = 'none';
        }, 300);
    };

    el('tirra-toggle').onclick = () => isChatOpen ? closeChat() : openChat();
    el('tc-minimize').onclick = closeChat;

    ['btn-chat-header', 'btn-chat-mobile', 'btn-chat-drawer'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = (e) => { e.preventDefault(); openChat(); };
    });

    el('tc-close-trigger').onclick = () => el('tc-modal-overlay').classList.add('active');
    el('tc-modal-cancel').onclick = () => el('tc-modal-overlay').classList.remove('active');
    
    el('tc-modal-confirm').onclick = () => {
        // Remove canal antes de limpar sessão
        if (realtimeChannel) {
            client.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        
        localStorage.removeItem('tc_sess');
        localStorage.removeItem('tc_vis');
        session = null; 
        visitor = null;
        isSending = false;
        
        el('tc-msgs').innerHTML = '';
        el('tc-name').value = ''; 
        el('tc-phone').value = '';
        el('tc-modal-overlay').classList.remove('active');
        el('tc-screen-chat').style.display = 'none';
        el('tc-screen-login').style.display = 'flex';
        closeChat();
    };

    const showTyping = () => {
        typingArea.style.display = 'block';
        msgsArea.scrollTop = msgsArea.scrollHeight;
    };
    const hideTyping = () => typingArea.style.display = 'none';

    // LOGIN
    el('tc-start-btn').onclick = async () => {
        unlockAudio();
        const name = el('tc-name').value.trim();
        const phone = el('tc-phone').value.trim();
        if (!name || !phone) return alert('Preencha os dados.');

        el('tc-start-btn').innerText = 'Conectando...';
        el('tc-start-btn').disabled = true;

        try {
            if (!client) throw new Error("Supabase offline");
            
            const { data, error } = await client.from('chat_sessions')
                .insert({ visitor_name: name, visitor_phone: phone }).select().single();
            
            if (error) throw error;

            session = data.id;
            visitor = name;
            localStorage.setItem('tc_sess', session);
            localStorage.setItem('tc_vis', name);
            
            showChatScreen();
            
            // Envia START (backend agora responde imediatamente)
            showTyping();
            fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
                body: JSON.stringify({ session_id: session, message: '##START##', visitor_name: visitor })
            }).catch(() => hideTyping());

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
        
        isSending = false;
        el('tc-msg-input').disabled = false;

        loadHistory();
        
        // FIX: Remove canais duplicados E cria apenas um
        if (realtimeChannel) {
            client.removeChannel(realtimeChannel);
        }
        
        realtimeChannel = client.channel(`widget_${session}`) // Nome único por sessão
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chat_messages', 
                    filter: `session_id=eq.${session}` 
                }, 
                (payload) => {
                    if (payload.new.sender !== 'user') {
                        handleIncoming(payload.new);
                    }
                }
            )
            .subscribe((status) => {
                console.log("📡 Realtime status:", status);
            });
    }

    async function loadHistory() {
        if (!session) return;
        const { data } = await client.from('chat_messages')
            .select('*')
            .eq('session_id', session)
            .order('created_at');
        
        el('tc-msgs').innerHTML = '';
        if (data) data.forEach(m => addMsg(m.sender, m.content, false));
    }

    function handleIncoming(msg) {
        showTyping();
        setTimeout(() => {
            hideTyping();
            addMsg(msg.sender, msg.content, true);
        }, 2000); // Delay cosmético reduzido
    }

    const sendMsg = async () => {
        const txt = el('tc-msg-input').value.trim();
        if (!txt || isSending) return;

        isSending = true;
        el('tc-msg-input').disabled = true;
        addMsg('user', txt, false);
        el('tc-msg-input').value = '';
        
        showTyping();

        try {
            await fetch(EDGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
                body: JSON.stringify({ session_id: session, message: txt, visitor_name: visitor })
            });
        } catch (e) {
            hideTyping();
            addMsg('ai', '⚠️ Falha na conexão.', false);
        } finally {
            isSending = false;
            el('tc-msg-input').disabled = false;
            el('tc-msg-input').focus();
        }
    };

    el('tc-send-btn').onclick = sendMsg;
    el('tc-msg-input').onkeypress = (e) => { if (e.key === 'Enter') sendMsg(); };

    function addMsg(sender, text, playSound = false) {
        const div = document.createElement('div');
        div.className = `msg-row msg-${sender === 'user' ? 'user' : 'ai'}`;
        const label = sender === 'ai' ? '<div class="msg-label">Isabel</div>' : '';
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
        msgsArea.appendChild(div);
        msgsArea.scrollTop = msgsArea.scrollHeight;
        
        if (playSound && audioUnlocked) {
            try { 
                notificationSound.currentTime = 0;
                notificationSound.play().catch(() => {}); 
            } catch (e) {}
        }
    }

    // FIX: Previne scroll ao focar input no mobile
    el('tc-msg-input').addEventListener('focus', () => {
        setTimeout(() => {
            msgsArea.scrollTop = msgsArea.scrollHeight;
        }, 300);
    });
})();
