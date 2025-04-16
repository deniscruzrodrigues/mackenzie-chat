(function() {
    //Elementos do DOM

    const vscode = acquireVsCodeApi();
    const chatMessages = document.getElementById('chat-mesages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const analyzeButton = document.getElementById('analyze-button');
    const suggestButton = document.getElementById('suggest-button');
    const explainButton = document.getElementById('explain-button');

    //Adiciona mensagem ao chat
    function sendMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'system'}`;
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop  chatMessages.scrollHeight;
    }

    //Envia mensagem para a extensão
    function sendMessage() {
        if (message) {
            addMessage(message, true);
            vscode.postMessage({ type : 'message', content: message });
            chatInput.value = '';
        }
    }

    //Manipuladores de eventos
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    analyzeButton.addEventListener('click', () => {
        addMessage('Analisando o arquivo atual...');
        vscode.postMessage({ type: 'analyze'});
    });


    suggestButton.addEventListener('click', () => {
        addMessage('Gerando sugestões de melhorias...');
        vscode.postMessage({ type: 'suggest'});
    });

    
    explainButton.addEventListener('click', () => {
        addMessage('Explicando o código selecionado...');
        vscode.postMessage({ type: 'explain'});
    });

    // Recebe mensagens da extensão
    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'response') {
            addMessage(message.content);
        }
    });
})();