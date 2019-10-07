import express from 'express';
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";

const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);

const port = "3000";

const staticFolder = path.resolve(__dirname + "/../public/build");
const htmlFolder = path.resolve(staticFolder + "/html");

let connections: Array<string> = [];

app.use(express.static(staticFolder));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

io.on("connect", (socket: socketio.Socket) => {
    connections.push(socket.id);
    console.log("New connection: " + socket.id);



    socket.on('disconnect', () => {
        connections = connections.filter((val) => val != socket.id);
        console.log("Client disconnected: " + socket.id);
    });



    socket.on("master-change-background", function (msg: {
        color: string
    }) {
        console.log("Attempting to change background by master");
        if (socket.id === connections[0]) {
            console.log("IS MASTER");
            io.emit("change-background", msg);
        }
    });
});

server.listen(port, () => {
    return console.log(`Server listening on port: ${port}`);
});
