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

app.use(express.static(staticFolder));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

io.on("connect", (socket: socketio.Socket) => {
    console.log("New connection!");
});

server.listen(port, () => {
    return console.log(`Server listening on port: ${port}`);
});