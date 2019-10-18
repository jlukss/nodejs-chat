const app = require('http').createServer(handler)
const socketServer = require('./socketServer')(app);

app.listen(3000);

function handler(req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

process.on('SIGTERM', () => {
    socketServer.emit('chat event', 'Server is going down', () => {
        socketServer.close(() => {
            app.close(() => {
                process.exit(0);
            });
        });
    });
});