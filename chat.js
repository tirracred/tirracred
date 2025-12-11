// Arquivo: chat.js
(function() {
    console.log("🚀 Iniciando Widget TirraCred...");

    // 1. INJEÇÃO DE ESTILOS (CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        #tirra-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: sans-serif; display: flex; flex-direction: column; align-items: flex-end; }
        #tirra-toggle { width: 60px; height: 60px; border-radius: 50%; background: #16a34a; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        #tirra-toggle:hover { transform: scale(1.1); }
        #tirra-window { display: none; margin-bottom: 15px; width: 350px; max-width: 90vw; height: 500px; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; border: 1px solid #e5e7eb; }
        .tc-header { background: #16a34a; padding: 16px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .tc-btn { width: 100%; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        .tc-btn:disabled { background: #86efac; cursor: not-allowed; }
        .tc-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; box-sizing: border-box; outline: none; }
        .tc-input:focus { border-color: #16a34a; }
        .msg-row { display: flex; margin-bottom: 10px; }
        .msg-user { justify-content: flex-end; }
        .msg-ai { justify-content: flex-start; }
        .msg-bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; }
        .bubble-user { background: #16a34a; color: white; border-bottom-right-radius: 2px; }
        .bubble-ai { background: #f3f4f6; color: #1f2937; border: 1px solid #e5e7eb; border-bottom-left-radius: 2px; }
        .bubble-admin { background: #2563eb; color: white; border-bottom-left-radius: 2px; }
        @keyframes popIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pop { animation: popIn 0.3s ease-out; }
    `;
    document.head.appendChild(style);

    // 2. INJEÇÃO DE HTML
    const root = document.createElement('div');
    root.id = 'tirra-widget-container';
    root.innerHTML = `
        <div id="tirra-window" class="animate-pop">
            <div class="tc-header">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="position:relative;">
                        <img src="public/favincon.png" style="width:32px; height:32px; background:white; border-radius:50%; padding:2px;" onerror="this.src='https://placehold.co/40x40/fff/16a34a?text=T'">
                        <span style="position:absolute; bottom:0; right:0; width:10px; height:10px; background:#86efac; border:2px solid #16a34a; border-radius:50%;"></span>
                    </div>
                    <div>
                        <div style="font-weight:bold; font-size:14px;">Atendimento TirraCred</div>
                        <div style="font-size:11px; opacity:0.9;">Online agora ⚡</div>
                    </div>
                </div>
                <button id="tc-close" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;">&times;</button>
            </div>

            <div id="tc-screen-login" style="padding:24px; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <h3 style="text-align:center; color:#374151; margin-bottom:5px;">Olá! 👋</h3>
                <p style="text-align:center; color:#6b7280; font-size:13px; margin-bottom:20px;">Identifique-se para iniciar.</p>
                <input id="tc-name" class="tc-input" placeholder="Seu Nome">
                <input id="tc-phone" class="tc-input" placeholder="Seu WhatsApp">
                <button id="tc-start-btn" class="tc-btn">INICIAR CHAT ➤</button>
            </div>

            <div id="tc-screen-chat" style="display:none; flex:1; flex-direction:column; height:100%; background:#fff;">
                <div id="tc-msgs" style="flex:1; overflow-y:auto; padding:16px; background:#f9fafb;"></div>
                <div style="padding:12px; border-top:1px solid #e5e7eb; display:flex; gap:8px;">
                    <input id="tc-msg-input" class="tc-input" style="margin:0;" placeholder="Digite...">
                    <button id="tc-send-btn" style="padding:0 15px; background:#16a34a; color:white; border:none; border-radius:8px; cursor:pointer;">➤</button>
                </div>
            </div>
        </div>

        <button id="tirra-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
    `;
    document.body.appendChild(root);

    // 3. LÓGICA DO CHAT
    const SB_URL = 'https://hgravyvorwbccyufgksn.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncmF2eXZvcndiY2N5dWZna3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzUzMTksImV4cCI6MjA2NzA1MTMxOX0.7s_nF8aRgq6gauYhIEHBrqpvO5QzNtgrZHbBaukM0LI';
    const EDGE_URL = 'https://hgravyvorwbccyufgksn.supabase.co/functions/v1/chat-bot';

    let client = null;
    let session = localStorage.getItem('tc_sess');
    let visitor = localStorage.getItem('tc_vis');

    // Inicializa Supabase
    if (window.supabase) {
        client = window.supabase.createClient(SB_URL, SB_KEY);
    } else {
        console.error("Supabase não carregou. Verifique o index.html");
        return;
    }

    
    const el = (id) => root.querySelector('#'+id);
    const win = el('tirra-window');


    el('tirra-toggle').onclick = () => {
        const isClosed = win.style.display === 'none' || win.style.display === '';
        win.style.display = isClosed ? 'flex' : 'none';
        if (isClosed && session) showChatScreen();
    };
    el('tc-close').onclick = () => win.style.display = 'none';


    el('tc-start-btn').onclick = async () => {
        const name = el('tc-name').value;
        const phone = el('tc-phone').value;
        if (!name) return alert('Por favor, digite seu nome.');

        el('tc-start-btn').innerText = 'Entrando...';
        el('tc-start-btn').disabled = true;

        try {
            const { data, error } = await client.from('chat_sessions').insert({ visitor_name: name, visitor_phone: phone }).select().single();
            if (error) throw error;

            session = data.id;
            visitor = name;
            localStorage.setItem('tc_sess', session);
            localStorage.setItem('tc_vis', name);
            
            showChatScreen();
            addMsg('ai', `Olá ${name}! Sou a Sofia. Em que posso ajudar hoje?`);
        } catch (e) {
            console.error(e);
            alert('Erro ao conectar. Tente novamente.');
            el('tc-start-btn').innerText = 'TENTAR NOVAMENTE';
            el('tc-start-btn').disabled = false;
        }
    };


    const sendMsg = async () => {
        const input = el('tc-msg-input');
        const txt = input.value.trim();
        if(!txt) return;

        input.value = '';
        addMsg('user', txt);

        try {
            // --- AQUI ESTAVA O PROBLEMA ---
            // Adicionamos o 'Authorization' para corrigir o erro 401
            await fetch(EDGE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + SB_KEY  // <--- O "CRACHÁ" QUE FALTAVA
                },
                body: JSON.stringify({ session_id: session, message: txt, visitor_name: visitor })
            });
        } catch(e) {
            console.error(e);
            addMsg('ai', '⚠️ Erro de conexão com a IA.');
        }
    };

    el('tc-send-btn').onclick = sendMsg;
    el('tc-msg-input').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };


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


        const label = sender === 'admin' ? '<div style="font-size:10px; color:#2563eb; margin-bottom:2px;">Atendente</div>' : '';
        
        div.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:${sender === 'user' ? 'flex-end' : 'flex-start'}">
                ${label}
                <div class="msg-bubble bubble-${type}">${text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        
        const area = el('tc-msgs');
        area.appendChild(div);
        area.scrollTop = area.scrollHeight;
    }

})();