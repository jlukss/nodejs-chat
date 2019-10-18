class Client {
    constructor(server, socket, nickname, defaultTimeout) {
        this._nickname = nickname;
        this._server = server;
        this._socket = socket;
        this._connected = true;
        this._timeout = defaultTimeout;

        socket.on('disconnect', (reason) => this.onDisconnect());
        socket.on('error', (reason) => this.onDisconnect());

        socket.on('message', (message, callback) => this.onMessage(message, callback));
        
        console.log(nickname + ' connected', socket.id);
        // this._server.emit('chat event', this._nickname + ' joined chat');

        this.resetTimer();
    }

    onMessage(message, callback) {
        this.resetTimer();
        if (this.validateData(message)) {
            this._server.emit('message', this._nickname + ': ' + message);
            console.log('Received message from ' + this._nickname + ': ' + message);

            if (callback != undefined) {
                return callback(message);
            }
        }

        if (callback != undefined) {
            callback(false);
        }
    }

    onDisconnect() {
        if (this._connected) {
            console.log(this._nickname + ' disconnected');
            this._server.emit('chat event', this._nickname + ' left the chat, connection lost');
            if (this._timer) {
                clearTimeout(this._timer);
            }
        }
    }
    
    resetTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => this.closeConnection(), this._timeout);
    }
    
    closeConnection() {
        this._server.emit('chat event', this._nickname + ' was disconnected due to inactivity');
        this._connected = false;
        this._socket.disconnect(true);
        console.log(this._nickname + ' kicked');
    }

    validateData(data) {
        let re = new RegExp('<\\/?[\\w\\s\\"\\=]+>');

        if (data.length > 0) {
            if (data.indexOf('\n') == -1) {
                if (!re.test(data)) {
                    return true;
                }
            }
        }

        return false;
    }

    get nickname() {
        return this._nickname;
    }
}

module.exports = Client;