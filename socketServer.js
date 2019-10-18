const socketIO = require('socket.io');
const Client = require('./src/Client');


function socketServer(serverToBind, defaultTimeout = 30000) {
    const wsServer = socketIO(serverToBind);

    wsServer.use((socket, next) => {
        if (nicknameExists(wsServer, socket.handshake.query.nickname)) {
            console.error('Nickname exists');
            return next(new Error('Username already exists'));
        }
        if (!validateNickname(socket.handshake.query.nickname)) {
            console.error('Nickname invalid');
            return next(new Error('Invalid nickname'));
        }
        console.log('Nickname unique');
        return next();
    });
  
    wsServer.on('connection', (clientSocket) => {
        clientSocket.clientData = new Client(wsServer, clientSocket, clientSocket.handshake.query.nickname, defaultTimeout);

    });

    return wsServer;
}

function nicknameExists(server, nickname) {
    console.info('Check nickname exists: ' + nickname);
    return Object.keys(server.sockets.sockets).find(function(e) {
        if (server.sockets.sockets[e].clientData) {
            if (server.sockets.sockets[e].connected && server.sockets.sockets[e].clientData.nickname == nickname) {
                return true;
            }
        }
    }) != undefined;
}

function validateNickname(nickname) {
    re = new RegExp('^[a-zA-Z0-9]+$');

    return re.test(nickname);
}
  
module.exports = socketServer;