import express from "express";
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";
import multer from "multer";
import Connections from "./server/Connections";
import handleImageUpload from "./server/handleImageUpload";
import {
	MasterEventTypes,
	SlaveEventTypes
} from "./types/SocketIOEvents";

console.log("Starting server...");

export const app = express();
const server = http.createServer(app);
export const io = socketio.listen(server);

const port = process.env.PORT || "3000";

const staticFolder = path.resolve(__dirname + "/public");
export const htmlFolder = path.resolve(staticFolder + "/html");

let connections: Connections = new Connections();

app.use(express.static(staticFolder));

app.get("/", (req, res) => {
	res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

const multerSlaveImageType = multer().single("image");
app.post("/slaveImg", multerSlaveImageType, handleImageUpload);

io.on("connect", (socket: socketio.Socket) => {
	connections.add(socket);

	socket.on("disconnect", () => {
		connections.remove(socket);
	});

	socket.on(
		MasterEventTypes.ChangeSlaveBackgrounds,
		(msg: { [key: string]: string }) => {
			if (socket.id === connections.master.id) {
				console.log("Attempting to change background by master");
				for (const slaveId of Object.keys(msg)) {
					io.to(slaveId).emit(SlaveEventTypes.ChangeBackground, {
						color: msg[slaveId]
					});
				}
			}
		}
	);
	
	socket.on(
		MasterEventTypes.SendArrowsUp, () => {
			if (socket.id === connections.master.id) {
				console.log("Attempting to display arrow by master");
				for (const slaveId of connections.slaveIDs) {
					io.to(slaveId).emit(SlaveEventTypes.DisplayArrowUp);
				}
			}
		}
	);

	socket.on(
		MasterEventTypes.SendArrowsRight, () => {
			if (socket.id === connections.master.id) {
				console.log("Attempting to display arrow by master");
				for (const slaveId of connections.slaveIDs) {
					io.to(slaveId).emit(SlaveEventTypes.DisplayArrowRight);
				}
			}
		}
	);
});

server.listen(port, () => {
	return console.log(`Server listening on port: ${port}`);
});

