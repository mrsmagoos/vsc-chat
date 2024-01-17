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

    document.getElementById('search-user').onsubmit = (evt) => {
        evt.preventDefault();
        const input = evt.target.querySelector('input');

        if (input.value.trim() !== '') {
            const messageBody = {
                'type': 'search-user',
                'message': input.value.trim(),
                'session': session
            };
            input.value = '';

            document.getElementById('search-user-results').classList.remove('hidden');
            document.getElementById('search-user-results').classList.add('flex');

            document.getElementById('search-user-label').classList.remove('hidden');
            document.getElementById('search-user-label').classList.add('flex');

            document.getElementById('search-button').classList.add('hidden');
            document.getElementById('clear-search').classList.remove('hidden');

            ws.send(JSON.stringify(messageBody));
        }
    };

    document.getElementById('clear-search').onclick = (evt) => {
        evt.preventDefault();

        document.getElementById('search-user-results').innerHTML = '';

        document.getElementById('search-user-results').classList.remove('flex');
        document.getElementById('search-user-results').classList.add('hidden');

        document.getElementById('search-user-label').classList.remove('flex');
        document.getElementById('search-user-label').classList.add('hidden');

        document.getElementById('search-button').classList.remove('hidden');
        document.getElementById('clear-search').classList.add('hidden');
    }

    document.getElementById('search-user-input').onfocus = (evt) => {
        document.getElementById('search-button').classList.remove('hidden');
        document.getElementById('clear-search').classList.add('hidden');
    }

    document.getElementById('search-user-input').onkeydown = (evt) => {
        document.getElementById('search-button').classList.remove('hidden');
        document.getElementById('clear-search').classList.add('hidden');
    }

    document.getElementById('search-user-input').onclick = (evt) => {
        document.getElementById('search-button').classList.remove('hidden');
        document.getElementById('clear-search').classList.add('hidden');
    }
    

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

        }

        if (messageBody.type === 'search-user') {
            const users = messageBody.users;
            console.log('users', users);

            // clear previous results
            document.getElementById('search-user-results').innerHTML = '';

            if (users.length === 0) {
                const connectionsContainer = document.getElementById('search-user-results');
                const connectionDiv = document.createElement('div');
                connectionDiv.classList.add('text-center', 'w-full', 'opacity-60');
                connectionDiv.innerText = 'No users found';
                connectionsContainer.appendChild(connectionDiv);
            }

            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                const connectionsContainer = document.getElementById('search-user-results');
                const connectionDiv = document.createElement('div');

                const sanitizedUsername = escapeHtml(user.username);

                connectionDiv.setAttribute('title', `${sanitizedUsername}`);
                connectionDiv.classList.add('cursor-pointer', 'relative');

                const imgElement = document.createElement('img');
                imgElement.classList.add('w-7', 'h-7', 'rounded-full');
                imgElement.src = `https://avatars.githubusercontent.com/u/${user.id}?v=4`;

                connectionDiv.appendChild(imgElement);
                connectionsContainer.appendChild(connectionDiv);
                
            }

            document.getElementById('search-user-results').classList.remove('hidden');
            document.getElementById('search-user-results').classList.add('flex');
            document.getElementById('search-user-label').classList.remove('hidden');
            document.getElementById('search-user-label').classList.add('flex');

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

