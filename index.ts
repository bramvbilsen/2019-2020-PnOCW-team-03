import express from "express";
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";
import multer from "multer";
import * as fs from "fs";
import binaryToImageFile from "./imageProcessing/binaryToImageFile";

console.log("Starting server...");

const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);

const port = process.env.PORT || "3000";

const staticFolder = path.resolve(__dirname + "/public");
const htmlFolder = path.resolve(staticFolder + "/html");

export let connections: Array<string> = [];

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
	connections.push(socket.id);
	console.log("New connection: " + socket.id);
	console.log("Total connected: " + connections.length);

	io.to(getMaster()).emit("notify-master-of-slaves", {
		slaves: getSlaves()
	});

	if (getMaster() === socket.id) {
		socket.emit("user-type", {
			type: "master"
		});
	} else {
		socket.emit("user-type", {
			type: "slave"
		});
	}

	socket.on("disconnect", () => {
		connections = connections.filter(val => val != socket.id);
		io.to(getMaster()).emit("notify-master-of-slaves", {
			slaves: getSlaves()
		});
		console.log("Client disconnected: " + socket.id);
		console.log("Total connected: " + connections.length);
	});

	socket.on("master-change-all-background", function(msg: { color: string }) {
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

	socket.on("send-arrow-north", () => {
		if (socket.id === getMaster()) {
			console.log("Master attempts to display arrow north on slaves");
			for (const slaveId of getSlaves()) {
				io.to(slaveId).emit("display-arrow-north");
			}
		}
	});

	socket.on("send-arrow-right", () => {
		if (socket.id === getMaster()) {
			console.log("Master attempts to display arrow right on slaves");
			for (const slaveId of getSlaves()) {
				io.to(slaveId).emit("display-arrow-right");
			}
		}
	});
});

server.listen(port, () => {
	return console.log(`Server listening on port: ${port}`);
});
