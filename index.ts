import express from "express";
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";
import multer from "multer";
import * as fs from "fs";
import binaryToImageFile from "./imageProcessing/binaryToImageFile";
import Connections from "./server/Connections";
import {
	MasterEventTypes,
	SlaveEventTypes,
	SharedEventTypes
} from "./types/SocketIOEvents";

console.log("Starting server...");

const app = express();
const server = http.createServer(app);
export const io = socketio.listen(server);

const port = process.env.PORT || "3000";

const staticFolder = path.resolve(__dirname + "/public");
const htmlFolder = path.resolve(staticFolder + "/html");

//export let connections: Array<string> = [];
let connections: Connections = new Connections();

app.use(express.static(staticFolder));

app.get("/", (req, res) => {
	res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

const multerSlaveImageType = multer().single("image");
app.post("/slaveImg", multerSlaveImageType, (req, res) => {
	console.log("POSTED IMAGE");
	const imageFile = req.file;
	if (!imageFile || !/image\/(png|jpg|jpeg)/.test(imageFile.mimetype)) {
		console.log("BAD IMAGE");
		res.sendStatus(400);
	} else {
		const ext = imageFile.mimetype === "image/png" ? "png" : "jpg";
		const dest = path.resolve(__dirname + "/uploads/");
		const fileName = `image.${ext}`;
		binaryToImageFile(dest, fileName, imageFile.buffer)
			.then(() => {
				res.sendStatus(200);
			})
			.catch(err => {
				console.log("Failed to save image: " + err);
				res.sendStatus(500);
			});
	}
});

io.on("connect", (socket: socketio.Socket) => {
	connections.add(socket);
	console.log("New connection: " + socket.id);
	console.log("Total connected: " + connections.length);

	io.to(connections.master.id).emit(MasterEventTypes.SlaveChanges, {
		slaves: connections.slaveIDs
	});

	socket.on("disconnect", () => {
		// TODO: The connections.remove methods will emit a signal to the new master if there
		//  is a new one. Perhaps we need to wait for the new master to receive this before
		//  notifying of its slaves.
		connections.remove(socket);
		io.to(connections.master.id).emit(MasterEventTypes.SlaveChanges, {
			slaves: connections.slaveIDs
		});
		console.log("Client disconnected: " + socket.id);
		console.log("Total connected: " + connections.length);
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

	socket.on("display-arrow-north", () => {
		if (socket.id === connections.master.id) {
			for (const slaveId of connections.slaveIDs) {
				io.to(slaveId).emit("display-arrow-north");
			}
		}
	});

	socket.on("display-arrow-right", () => {
		if (socket.id === connections.master.id) {
			for (const slaveId of connections.slaveIDs) {
				io.to(slaveId).emit("display-arrow-right");
			}
		}
	});
});

server.listen(port, () => {
	return console.log(`Server listening on port: ${port}`);
});
