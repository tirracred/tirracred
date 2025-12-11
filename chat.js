(function() {
  console.log("🚀 Widget TirraCred: Iniciando...");

  // --------------------------------------------------------
  // 1. ESTILOS (CSS) - FLEXBOX CORRIGIDO
  // --------------------------------------------------------
  const style = document.createElement('style');
  style.innerHTML = `
    #tirra-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    /* Botão Flutuante */
    #tirra-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #16a34a;
      border: 4px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    #tirra-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    /* Janela - FLEXBOX PRINCIPAL CORRIGIDO */
    #tirra-window {
      display: none;
      margin-bottom: 15px;
      width: 360px;
      max-width: 90vw;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      animation: popIn 0.3s ease-out;
    }

    /* Header - ALTURA FIXA */
    .tc-header {
      background: #16a34a;
      padding: 16px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex-shrink: 0; /* NÃO ENCOLHE */
    }

    .tc-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tc-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tc-reset-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 16px;
    }

    .tc-reset-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }

    .tc-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .tc-close-btn:hover {
      transform: scale(1.1);
    }

    .tc-avatar {
      width: 36px;
      height: 36px;
      background: white;
      border-radius: 50%;
      padding: 2px;
      position: relative;
      flex-shrink: 0;
    }

    .tc-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .tc-status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: #86efac;
      border: 2px solid #16a34a;
      border-radius: 50%;
    }

    .tc-info {
      display: flex;
      flex-direction: column;
    }

    .tc-name {
      font-weight: 600;
      font-size: 14px;
    }

    .tc-subtitle {
      font-size: 11px;
      opacity: 0.9;
    }

    /* Conteúdo Principal - FLEX-GROW */
    #tc-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0; /* IMPORTANTE PARA SCROLL FUNCIONAR */
    }

    /* Tela de Login */
    #tc-login-screen {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .tc-login-title {
      font-size: 20px;
      font-weight: bold;
      color: #16a34a;
      margin-bottom: 8px;
      text-align: center;
    }

    .tc-login-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 24px;
      text-align: center;
    }

    .tc-form-group {
      width: 100%;
      margin-bottom: 16px;
    }

    .tc-input-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }

    .tc-security-note {
      font-size: 11px;
      color: #6b7280;
      text-align: center;
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    /* Área de Mensagens - SCROLL INTERNO */
    #tc-msgs {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
      min-height: 0; /* IMPORTANTE */
    }

    .msg-row {
      display: flex;
      width: 100%;
    }

    .msg-user {
      justify-content: flex-end;
    }

    .msg-ai {
      justify-content: flex-start;
    }

    .msg-bubble {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      position: relative;
      word-wrap: break-word;
    }

    .bubble-user {
      background: #16a34a;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .bubble-ai {
      background: #f3f4f6;
      color: #1f2937;
      border-bottom-left-radius: 4px;
    }

    .bubble-admin {
      background: #2563eb;
      color: white;
      border-bottom-left-radius: 4px;
    }

    .msg-label {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 2px;
      margin-left: 4px;
      font-weight: 600;
    }

    .msg-bubble a {
      color: inherit;
      text-decoration: underline;
      font-weight: bold;
    }

    .bubble-ai a {
      color: #16a34a;
    }

    /* Footer Input - ALTURA FIXA */
    #tc-input-area {
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0; /* NÃO ENCOLHE */
    }

    #tc-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
      background: #f9fafb;
      transition: all 0.2s;
    }

    #tc-input:focus {
      border-color: #16a34a;
      background: white;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }

    #tc-send-btn {
      width: 40px;
      height: 40px;
      background: #16a34a;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    #tc-send-btn:hover {
      background: #15803d;
      transform: scale(1.05);
    }

    #tc-send-btn:disabled {
      background: #86efac;
      cursor: not-allowed;
    }

    /* Inputs e Botões */
    .tc-btn {
      width: 100%;
      padding: 14px;
      background: #16a34a;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
      font-size: 15px;
      transition: background 0.2s;
    }

    .tc-btn:hover {
      background: #15803d;
    }

    .tc-btn:disabled {
      background: #86efac;
      cursor: not-allowed;
      opacity: 0.8;
    }

    .tc-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-sizing: border-box;
      outline: none;
      font-size: 14px;
      background: #f9fafb;
      transition: all 0.2s;
    }

    .tc-input:focus {
      border-color: #16a34a;
      background: white;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }

    .tc-input:disabled {
      background: #f3f4f6;
      cursor: wait;
    }

    @keyframes popIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  // --------------------------------------------------------
  // 2. HTML ESTRUTURA - COM BOTÃO DE RESET
  // --------------------------------------------------------
  const root = document.createElement('div');
  root.id = 'tirra-widget-container';
  root.innerHTML = `
    <!-- Botão Flutuante -->
    <div id="tirra-toggle">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    </div>

    <!-- Janela do Chat -->
    <div id="tirra-window">
      <!-- Header -->
      <div class="tc-header">
        <div class="tc-header-left">
          <div class="tc-avatar">
            <img src="https://i.postimg.cc/gkGjjdD7/izabel.png" alt="Isabel">
            <div class="tc-status"></div>
          </div>
          <div class="tc-info">
            <div class="tc-name">Isabel</div>
            <div class="tc-subtitle">Consultora de Crédito</div>
          </div>
        </div>
        <div class="tc-header-right">
          <button class="tc-reset-btn" id="tc-reset-btn" title="Reiniciar atendimento">
            🔄
          </button>
          <button class="tc-close-btn" id="tc-close-btn">×</button>
        </div>
      </div>

      <!-- Conteúdo -->
      <div id="tc-content">
        <!-- Tela de Login -->
        <div id="tc-login-screen">
          <div class="tc-login-title">👋 Olá! Sou a Isabel</div>
          <div class="tc-login-subtitle">Preencha seus dados para receber atendimento especializado.</div>
          
          <div class="tc-form-group">
            <label class="tc-input-label">Nome Completo</label>
            <input type="text" id="tc-name-input" class="tc-input" placeholder="Digite seu nome" />
          </div>
          
          <div class="tc-form-group">
            <label class="tc-input-label">WhatsApp</label>
            <input type="tel" id="tc-phone-input" class="tc-input" placeholder="(00) 00000-0000" />
          </div>
          
          <button class="tc-btn" id="tc-start-btn">Iniciar Atendimento</button>
          
          <div class="tc-security-note">
            🔒 Seus dados estão 100% seguros.
          </div>
        </div>

        <!-- Área de Chat (escondida inicialmente) -->
        <div id="tc-msgs" style="display:none;"></div>
      </div>

      <!-- Footer Input (escondido inicialmente) -->
      <div id="tc-input-area" style="display:none;">
        <input type="text" id="tc-input" placeholder="Digite sua mensagem..." />
        <button id="tc-send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // --------------------------------------------------------
  // 3. VARIÁVEIS
  // --------------------------------------------------------
  const toggleBtn = document.getElementById('tirra-toggle');
  const chatWindow = document.getElementById('tirra-window');
  const closeBtn = document.getElementById('tc-close-btn');
  const resetBtn = document.getElementById('tc-reset-btn');
  const loginScreen = document.getElementById('tc-login-screen');
  const msgsDiv = document.getElementById('tc-msgs');
  const inputArea = document.getElementById('tc-input-area');
  const startBtn = document.getElementById('tc-start-btn');
  const nameInput = document.getElementById('tc-name-input');
  const phoneInput = document.getElementById('tc-phone-input');
  const msgInput = document.getElementById('tc-input');
  const sendBtn = document.getElementById('tc-send-btn');

  let sessionId = localStorage.getItem('tirra_session_id');
  let visitorName = localStorage.getItem('tirra_visitor_name');

  // --------------------------------------------------------
  // 4. FUNÇÕES AUXILIARES
  // --------------------------------------------------------
  
  // Função para resetar completamente o atendimento
  function resetChat() {
    if (!confirm('Deseja realmente reiniciar o atendimento? Todo o histórico será perdido.')) {
      return;
    }
    
    // Limpar localStorage
    localStorage.removeItem('tirra_session_id');
    localStorage.removeItem('tirra_visitor_name');
    
    // Resetar variáveis
    sessionId = null;
    visitorName = null;
    
    // Limpar mensagens
    msgsDiv.innerHTML = '';
    
    // Limpar inputs
    nameInput.value = '';
    phoneInput.value = '';
    msgInput.value = '';
    
    // Mostrar tela de login novamente
    loginScreen.style.display = 'flex';
    msgsDiv.style.display = 'none';
    inputArea.style.display = 'none';
    
    console.log('✅ Chat resetado com sucesso');
  }

  function addMessage(sender, content) {
    const row = document.createElement('div');
    row.className = sender === 'user' ? 'msg-row msg-user' : 'msg-row msg-ai';

    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'msg-bubble bubble-user' : 'msg-bubble bubble-ai';
    bubble.innerHTML = content;

    row.appendChild(bubble);
    msgsDiv.appendChild(row);
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage('user', text);
    msgInput.value = '';
    msgInput.disabled = true;
    sendBtn.disabled = true;

    try {
      const res = await fetch('https://uzvzbpkhvcxbjfuzbhfq.supabase.co/functions/v1/chat-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dnpicGtodmN4YmpmdXpiaGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3OTc1MzgsImV4cCI6MjA0OTM3MzUzOH0.TnDJBcGMHNc5jTuDNqyILGVUKrLKx9NqZ1h-S1I34b0'
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          visitor_name: visitorName
        })
      });

      const data = await res.json();
      if (data.reply) {
        addMessage('ai', data.reply);
      } else {
        addMessage('ai', '❌ Desculpe, ocorreu um erro. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      addMessage('ai', '❌ Falha na conexão. Verifique sua internet.');
    } finally {
      msgInput.disabled = false;
      sendBtn.disabled = false;
      msgInput.focus();
    }
  }

  // --------------------------------------------------------
  // 5. EVENTOS
  // --------------------------------------------------------
  
  // Toggle do widget
  toggleBtn.addEventListener('click', () => {
    const isOpen = chatWindow.style.display === 'flex';
    chatWindow.style.display = isOpen ? 'none' : 'flex';
  });

  // Fechar
  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  // Botão de Reset
  resetBtn.addEventListener('click', resetChat);

  // Iniciar atendimento
  startBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    startBtn.disabled = true;
    startBtn.textContent = 'Conectando...';

    try {
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      localStorage.setItem('tirra_session_id', newSessionId);
      localStorage.setItem('tirra_visitor_name', name);
      
      sessionId = newSessionId;
      visitorName = name;

      loginScreen.style.display = 'none';
      msgsDiv.style.display = 'flex';
      inputArea.style.display = 'flex';

      addMessage('ai', `Olá ${name}! 👋 Sou a Isabel, sua consultora de crédito. Vou te ajudar a encontrar as melhores opções para você! 🎯<br><br>Vamos começar: seu CPF está negativado ou com restrições?`);
      
      msgInput.focus();
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      alert('Erro ao conectar. Tente novamente.');
      startBtn.disabled = false;
      startBtn.textContent = 'Iniciar Atendimento';
    }
  });

  // Enviar mensagem
  sendBtn.addEventListener('click', () => {
    sendMessage(msgInput.value);
  });

  msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage(msgInput.value);
    }
  });

  // --------------------------------------------------------
  // 6. AUTO-ABRIR SE JÁ TIVER SESSÃO
  // --------------------------------------------------------
  if (sessionId && visitorName) {
    loginScreen.style.display = 'none';
    msgsDiv.style.display = 'flex';
    inputArea.style.display = 'flex';
  }

  console.log("✅ Widget carregado com sucesso!");
})();
