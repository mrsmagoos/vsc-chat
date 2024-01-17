const getConnections = async () => {
    const response = await fetch('localhost:3000/connections', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': session
        }
    });

    const connections = await response.json();
    console.log(connections);
    return connections;
};

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

                document.getElementById('connections').innerHTML += `
                    <div title="${connection.username}" class="cursor-pointer">
                        <img class="w-7 h-7 rounded-full" src="https://avatars.githubusercontent.com/u/${connection.id}?v=4">
                    </div>
                `;
                
            }

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

