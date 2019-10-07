import express from 'express';
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";
import multer from "multer";

const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);

const port = "3000";

const staticFolder = path.resolve(__dirname + "/../public/build");
const htmlFolder = path.resolve(staticFolder + "/html");

let connections: Array<string> = [];

function getMaster(): string | null {
    if (connections.length === 0) {
        return null;
    }
    return connections[0];
}

function getSlaves(): Array<string> {
    if (connections.length <= 1) {
        return [];
    }
    return connections.slice(1);
}

app.use(express.static(staticFolder));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

app.post("/slaveImg", multer({ dest: 'uploads/' }).single("./slavesImg"), (req, res) => {

});

io.on("connect", (socket: socketio.Socket) => {
    connections.push(socket.id);
    console.log("New connection: " + socket.id);
    console.log('Total connected: ' + connections.length);

    io.to(getMaster()).emit("notify-master-of-slaves", {
        slaves: getSlaves()
    });

    socket.on('disconnect', () => {
        connections = connections.filter((val) => val != socket.id);
        io.to(getMaster()).emit("notify-master-of-slaves", {
            slaves: getSlaves()
        });
        console.log("Client disconnected: " + socket.id);
        console.log('Total connected: ' + connections.length);
    });



    socket.on("master-change-all-background", function (msg: {
        color: string
    }) {
        console.log("Attempting to change background by master");
        if (socket.id === connections[0]) {
            console.log("IS MASTER");
            io.emit("change-background", msg);
        }
    });

    socket.on("change-slave-bg", (msg: { [key: string]: string }) => {

        if (socket.id === connections[0]) {
            console.log("Attempting to change background by master");
            console.log(getSlaves());
            console.log(Object.keys(msg));
            for (const slaveId of Object.keys(msg)) {
                console.log(msg[slaveId]);
                io.to(slaveId).emit("change-background", {
                    color: msg[slaveId]
                });
            }
        }
    });


});



server.listen(port, () => {
    return console.log(`Server listening on port: ${port}`);
});
