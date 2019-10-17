const socketIO = require('socket.io');
const Client = require('./src/Client');


function socketServer(serverToBind, defaultTimeout = 30000) {
    const wsServer = socketIO(serverToBind);

    wsServer.use((socket, next) => {
        if (nicknameExists(wsServer, socket.handshake.query.nickname)) {
            console.log('Nickname exists');
            return next(new Error('Authentication error'));
        }
        console.log('Nickname unique');
        return next();
    });
  
    wsServer.on('connection', (clientSocket) => {
        clientSocket.clientData = new Client(wsServer, clientSocket, clientSocket.handshake.query.nickname, defaultTimeout);
    });
}

function nicknameExists(server, nickname) {
    console.log('Check nickname exists: ' + nickname);
    return Object.keys(server.sockets.sockets).find(function(e) {
        if (server.sockets.sockets[e].clientData) {
            if (server.sockets.sockets[e].clientData.nickname == nickname) {
                return true;
            }
        }
    }) != undefined;
}
  
module.exports = socketServer;