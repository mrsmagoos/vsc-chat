const escapeHtml = unsafe => unsafe.replace(/[&<"']/g, match => ({ '&': '&amp;', '<': '&lt;', '"': '&quot;', "'": '&#39;' }[match]));
let messagingUser;

const connectToServer = async () => {
    const ws = new WebSocket(`${webSocketUrl}/ws`);
    return new Promise((resolve) => {
        const timer = setInterval(() => {
            if (ws.readyState === 1) {
                clearInterval(timer);
                resolve(ws);
            }
        }, 10);
    });
};

const sendMessage = (ws, type, message, to) => {
    const messageBody = { type, message, session, to };
    ws.send(JSON.stringify(messageBody));
};

const toggleVisibility = (elementId, className, action) => {
    document.getElementById(elementId).classList[action](className);
};

const clearSearchResults = () => {
    document.getElementById('search-user-results').innerHTML = '';
    toggleVisibility('search-user-results', 'hidden', 'add');
    toggleVisibility('search-user-label', 'hidden', 'add');
    toggleVisibility('search-button', 'hidden', 'remove');
    toggleVisibility('clear-search', 'hidden', 'add');
};

const handleSendMessage = (ws, evt) => {
    evt.preventDefault();

    if (messagingUser !== undefined) {
        const input = evt.target.querySelector('input');
        if (input.value.trim() !== '') {
            sendMessage(ws, 'message', input.value.trim(), messagingUser);
            input.value = '';
        }
    }
};

const handleSearchUser = (ws, evt) => {
    evt.preventDefault();
    const input = evt.target.querySelector('input');
    if (input.value.trim() !== '') {
        sendMessage(ws, 'search-user', input.value.trim());
        input.value = '';
        toggleVisibility('search-user-results', 'hidden', 'remove');
        toggleVisibility('search-user-label', 'hidden', 'remove');
        toggleVisibility('search-button', 'hidden', 'add');
        toggleVisibility('clear-search', 'hidden', 'remove');
    }
};

const handleClearSearch = (evt) => {
    evt.preventDefault();
    clearSearchResults();
};

const handleSearchUserInput = (evt) => {
    toggleVisibility('search-button', 'hidden', 'remove');
    toggleVisibility('clear-search', 'hidden', 'add');
};

(async function () {
    const ws = await connectToServer();
    sendMessage(ws, 'command', 'getconnections');

    document.getElementById('message').onsubmit = evt => handleSendMessage(ws, evt);
    document.getElementById('search-user').onsubmit = evt => handleSearchUser(ws, evt);
    document.getElementById('clear-search').onclick = handleClearSearch;
    document.getElementById('search-user-input').onfocus = handleSearchUserInput;
    document.getElementById('search-user-input').onkeydown = handleSearchUserInput;
    document.getElementById('search-user-input').onclick = handleSearchUserInput;

    setInterval(() => {
        sendMessage(ws, 'command', 'getconnections');
    }, 10000);

    ws.onmessage = (webSocketMessage) => {
        const messageBody = JSON.parse(webSocketMessage.data);

        if (messageBody.type === 'message') {
            console.log('Message received', messageBody);

            if (messageBody.sender === messagingUser || messageBody.to === messagingUser) {
                const messagesContainer = document.getElementById('messages');
                const fromSelf = messageBody.sender !== messagingUser;

                var divElement = document.createElement('div');
                divElement.className = `flex flex-col gap-1 ${fromSelf ? 'pl-3 text-end' : 'pr-3'}`;

                var spanElement = document.createElement('span');
                spanElement.className = 'opacity-60 font-light';
                spanElement.textContent = `@${messageBody.senderUsername}`;

                var divMessageElement = document.createElement('div');
                divMessageElement.textContent = messageBody.message;

                divElement.appendChild(spanElement);
                divElement.appendChild(divMessageElement);

                messagesContainer.appendChild(divElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

        }

        if (messageBody.type === 'connections') {
            const connections = messageBody.connections;
            console.log('connections', connections);

            document.getElementById('connections').innerHTML = '';

            for (let i = 0; i < connections.length; i++) {
                const connection = connections[i];

                // bg-green-400
                // bg-red-400

                const connectionsContainer = document.getElementById('connections');
                const connectionDiv = document.createElement('div');

                connectionDiv.setAttribute('title', `${connection.username} | ${connection.online ? 'Online' : 'Offline'}`);
                connectionDiv.classList.add('cursor-pointer', 'relative');

                const imgElement = document.createElement('img');
                imgElement.classList.add('w-7', 'h-7', 'rounded-full');
                imgElement.src = `https://avatars.githubusercontent.com/u/${connection.id}?v=4`;

                const statusDiv = document.createElement('div');
                statusDiv.classList.add('bg-' + (connection.online ? 'green-400' : 'red-400'), 'border-4', 'border-bg', 'w-4', 'h-4', 'rounded-full', 'absolute', 'bottom-[-4px]', 'right-[-4px]');


                connectionDiv.appendChild(imgElement);
                connectionDiv.appendChild(statusDiv);

                connectionDiv.onclick = () => {
                    console.log('clicked', connection.id);
                    document.getElementById('send').placeholder = `Send message to @${connection.username}`;

                    messagingUser = connection.id;

                    if (document.getElementById('send').attributes.getNamedItem('disabled') !== null) {
                        document.getElementById('send').attributes.removeNamedItem('disabled');
                    }
                };

                connectionsContainer.appendChild(connectionDiv);
            }

            if (connections.length !== 0) {
                document.getElementById('connections').classList.remove('hidden');
                document.getElementById('connections').classList.add('flex');
                document.getElementById('connections-label').classList.remove('hidden');
                document.getElementById('connections-label').classList.add('flex');
            }

        }

        if (messageBody.type === 'search-user') {
            const users = messageBody.users;
            console.log('users', users);

            document.getElementById('search-user-results').innerHTML = '';

            if (users.length === 0) {
                const searchsContainer = document.getElementById('search-user-results');
                const searchDiv = document.createElement('div');
                searchDiv.classList.add('text-center', 'w-full', 'opacity-60');
                searchDiv.innerText = 'No users found';
                searchsContainer.appendChild(searchDiv);
            }

            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                const searchsContainer = document.getElementById('search-user-results');
                const searchDiv = document.createElement('div');

                const sanitizedUsername = escapeHtml(user.username);

                searchDiv.setAttribute('title', `${sanitizedUsername}`);
                searchDiv.classList.add('cursor-pointer', 'relative');

                const imgElement = document.createElement('img');
                imgElement.classList.add('w-7', 'h-7', 'rounded-full');
                imgElement.src = `https://avatars.githubusercontent.com/u/${user.id}?v=4`;

                searchDiv.appendChild(imgElement);

                searchDiv.onclick = () => {
                    console.log('clicked', user.id);
                    document.getElementById('send').placeholder = `Send message to @${user.username}`;
                    messagingUser = user.id;

                    if (document.getElementById('send').attributes.getNamedItem('disabled') !== null) {
                        document.getElementById('send').attributes.removeNamedItem('disabled');
                    }
                };

                searchsContainer.appendChild(searchDiv);

            }

            document.getElementById('search-user-results').classList.remove('hidden');
            document.getElementById('search-user-results').classList.add('flex');
            document.getElementById('search-user-label').classList.remove('hidden');
            document.getElementById('search-user-label').classList.add('flex');

        }

    };

})();