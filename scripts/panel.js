function escapeHtml(unsafe) {
    return unsafe.replace(/[&<"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

(async function() {
    const ws = await connectToServer();

    ws.send(JSON.stringify({
        'type': 'command',
        'message': 'getconnections',
        'session': session
    }));

    document.getElementById('message').onsubmit = (evt) => {
        evt.preventDefault();
        const input = evt.target.querySelector('input');

        if (input.value.trim() !== '') {
            const messageBody = {
                'type': 'message',
                'message': input.value.trim(),
                'session': session
            };
            input.value = '';
            ws.send(JSON.stringify(messageBody));
        }
    };

    ws.onmessage = (webSocketMessage) => {
        const messageBody = JSON.parse(webSocketMessage.data);

        if (messageBody.type === 'message') {
            console.log('Message received', messageBody);
        }

        if (messageBody.type === 'connections') {
            const connections = messageBody.connections;
            console.log('connections', connections);

            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];

                // bg-green-400
                // bg-red-400

                const connectionsContainer = document.getElementById('connections');
                const connectionDiv = document.createElement('div');

                const sanitizedUsername = escapeHtml(connection.username);

                connectionDiv.setAttribute('title', `${sanitizedUsername} | ${connection.online ? 'Online' : 'Offline'}`);
                connectionDiv.classList.add('cursor-pointer', 'relative');

                const imgElement = document.createElement('img');
                imgElement.classList.add('w-7', 'h-7', 'rounded-full');
                imgElement.src = `https://avatars.githubusercontent.com/u/${connection.id}?v=4`;

                const statusDiv = document.createElement('div');
                statusDiv.classList.add('bg-' + (connection.online ? 'green-400' : 'red-400'), 'border-4', 'border-bg', 'w-4', 'h-4', 'rounded-full', 'absolute', 'bottom-[-4px]', 'right-[-4px]');

                connectionDiv.appendChild(imgElement);
                connectionDiv.appendChild(statusDiv);

                connectionsContainer.appendChild(connectionDiv);
                
            }

            document.getElementById('connections').innerHTML += `
            <div title="Add connection" class="cursor-pointer relative">
                <div class="w-7 h-7 rounded-full bg-vscode text-vscode flex place-content-center place-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            </div>
            `;

        }

    };
    
    async function connectToServer() {
        const ws = new WebSocket('ws://localhost:7071/ws');
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                if(ws.readyState === 1) {
                    clearInterval(timer);
                    resolve(ws);
                }
            }, 10);
        });
    }

})();

