const expect = require('chai').expect;
const wsServer = require('../socketServer');
const http = require('http');
const client = require('socket.io-client');

describe('Websocket server', ()  => {
    let server = undefined;
    
    before((done) => {
        server = http.createServer(() => console.log(" -/- "));
        wsServer(server, 200);
        server.listen(7575, () => {
            done();
        });
    });
    
    after((done) => {
        server.on('close', () => {
            done();
        });
        server.close(() => {
            server.unref();
        });
    });
    
    it('Sends received messages to all connected clients (no rooms).', (done) => {
        const wsClient1 = client('http://localhost:7575/', {query: { nickname: 'John' }});
        const wsClient2 = client('http://localhost:7575/', {query: { nickname: 'Jane' }});
        
        wsClient1.emit('message', 'test message');
        wsClient2.on('message', (data) => {
            done();
            expect(data).to.equal('John: test message');
            wsClient1.close();
            wsClient2.close();
        });
    });

    it('should disconnect client if a client is silent for more than a certain (configurable) amount of time', (done) => {
        const wsClient = client('http://localhost:7575/', {query: { nickname: 'John' }});
        
        wsClient.on('chat event', (data) => {
            done();
            wsClient.close();
            expect(data).to.equal('John was disconnected due to inactivity');
        });
    });

    it('should not disconnect if there was activity', (done) => {
        const wsClient = client('http://localhost:7575/', {query: { nickname: 'Curry' }});
        
        wsClient.on('chat event', () => {
            expect(data).to.not.equal('Curry was disconnected due to inactivity');
            done();
            wsClient.close();
        });

        setTimeout(() => {
            wsClient.emit('message', 'ping message', () => {
                setTimeout(() => {
                    done();
                    wsClient.close();
                }, 80);
            });
        }, 150)
    });

    it('should send different message if a client is disconnected, but not due to inactivity', (done) => {
        const wsClient2 = client('http://localhost:7575/', {query: { nickname: 'Jane' }});
        
        wsClient2.on('connect', () => {
            wsClient2.on('chat event', (data) => {
                done();
                wsClient2.close();
                expect(data).to.equal('John left the chat, connection lost');
            });
            const wsClient1 = client('http://localhost:7575/', {query: { nickname: 'John' }});
            
            wsClient1.on('connect', () => {
                wsClient1.disconnect();
                wsClient1.close();
            });
        });

    });

    it ('Doesn\'t allow multiple active users with the same nickname.', (done) => {
        const wsClient1 = client('http://localhost:7575/', {reconnection: false, query: {nickname: 'John'}});

        wsClient1.on('connect', () => {
            const wsClient2 = client('http://localhost:7575/', {reconnection: false, autoConnect: false, query: {nickname: 'John'}});
            wsClient2.on('error', (err) => {
                console.log(err);
                done();
                expect(wsClient2.connected).not.to.be.true;
                wsClient1.close();
                wsClient2.close();
            });
            wsClient2.open();

        });
    });

    it ('Should validate data received over the network.', (done) => {
        const wsClient = client('http://localhost:7575/', {reconnection: false, query: {nickname: 'Hacker'}});

        wsClient.on('connect', () => {
            wsClient.emit('message', '', (result) => {
                expect(result).to.be.false;

                wsClient.emit('message', 'abc\nabc', (result) => {
                    expect(result).to.be.false;

                    wsClient.emit('message', '<a href="link">link</a>', (result) => {
                        done();
                        wsClient.close();
                        expect(result).to.be.false;
                    });
                });
            });
        });

    });
})