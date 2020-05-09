import express from "express";
import compression from "compression";
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";
import multer from "multer";
import Connections from "./server/Connections";
import handleImageUpload from "./server/handleImageUpload";
import startListeningForServerCommands from "./server/input";
import {
    MasterEventTypes,
    SlaveEventTypes,
    SharedEventTypes,
} from "./types/SocketIOEvents";
import { createCSV } from "./server/csvMaker";
import {
    triangulationListeners,
    animationListeners,
    videoListeners,
    slaveBackgroundListeners,
    synchronizationListeners,
    displayImageOnSlavesListeners,
} from "./socketListeners";

console.log("Starting server...");

export const app = express();
const server = http.createServer(app);
export const io = socketio.listen(server, { pingTimeout: 60000 * 15 });

const port = process.env.PORT || "3000";

const staticFolder = path.resolve(__dirname + "/public");
const imgFolder = path.resolve(staticFolder + "/img");
export const htmlFolder = path.resolve(staticFolder + "/html");
const slaveImgUploadFolder = path.resolve(__dirname + "/server/uploads/slaves");

export const connections: Connections = new Connections();

app.use(express.static(staticFolder));
app.use("/images", express.static(imgFolder));
app.use("/slave_images", express.static(slaveImgUploadFolder));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

app.get("/", (req, res) => {
    res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

app.get("/non_colored_screen_img", (req, res) => {
    res.sendFile(path.resolve(staticFolder + "/img/1.png"));
});

app.get("/colored_screen_img", (req, res) => {
    res.sendFile(path.resolve(staticFolder + "/img/2.png"));
});

const multerSlaveImageType = multer().single("image");
app.post("/slaveImg", multerSlaveImageType, handleImageUpload);

let slaveIDsToConfirmOrientation: Set<string> = new Set();

io.on("connect", (socket: socketio.Socket) => {
    connections.add(socket);

    socket.on("disconnect", () => {
        connections.remove(socket);
    });

    socket.on(SlaveEventTypes.NotifyMasterThatPictureCanBeTaken, (_) => {
        socket
            .to(connections.masterID)
            .emit(MasterEventTypes.HandleNextSlaveFlowHanlderStep, {});
    });
    socket.on(
        SlaveEventTypes.sendVideoTimeStamp,
        (msg: { timeStamp: number; id: string }) => {
            socket
                .to(connections.masterID)
                .emit(MasterEventTypes.HandleVideoTimeStampsOnSlaves, {
                    timeStamp: msg.timeStamp,
                    id: msg.id,
                });
        }
    );

    socket.on(
        MasterEventTypes.RequestDetectionColor,
        (msg: {
            color: { r: number; g: number; b: number };
            slaveID: string;
        }) => {
            console.log(
                "Requesting " + msg.slaveID + " for a new background color!"
            );
            if (socket.id === connections.master.id) {
                socket
                    .to(msg.slaveID)
                    .emit(SlaveEventTypes.DisplayDetectionColor, msg);
            }
        }
    );
    socket.on(SlaveEventTypes.DisplayedDetectionColor, () => {
        console.log("Confirming new background color!");
        socket
            .to(connections.master.id)
            .emit(MasterEventTypes.ConfirmedDetectionColor);
    });

    socket.on(
        MasterEventTypes.RequestOrientationColors,
        (msg: { slaveIDs: string[] }) => {
            slaveIDsToConfirmOrientation = new Set(msg.slaveIDs);
            msg.slaveIDs.forEach((id) => {
                socket.to(id).emit(SlaveEventTypes.DisplayOrientationColors);
            });
        }
    );

    socket.on(SlaveEventTypes.DisplayedOrientationColors, () => {
        slaveIDsToConfirmOrientation.delete(socket.id);
        if (slaveIDsToConfirmOrientation.size == 0) {
            socket
                .to(connections.masterID)
                .emit(MasterEventTypes.ConfirmedOrientationColors);
        }
    });

    socket.on(
        MasterEventTypes.RequestTrackingScreen,
        (msg: { slaveID: string }) => {
            console.log("Requesting " + msg.slaveID + " for tracking!");
            if (socket.id === connections.master.id) {
                socket
                    .to(msg.slaveID)
                    .emit(SlaveEventTypes.DisplayTrackingScreen, msg);
            }
        }
    );
    socket.on(SlaveEventTypes.DisplayedTrackingScreen, (msg) => {
        console.log("Confirming tracking display!");
        socket
            .to(connections.master.id)
            .emit(MasterEventTypes.ConfirmedTrackingScreen, msg);
    });

    slaveBackgroundListeners(socket);

    synchronizationListeners(socket);

    videoListeners(socket);

    triangulationListeners(socket);

    animationListeners(socket);

    displayImageOnSlavesListeners(socket);
});

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
    startListeningForServerCommands((input) => {
        switch (input) {
            case "kill_all":
                connections.slaves.forEach((slave) => slave.disconnect());
                if (connections.master) connections.master.disconnect();
                console.log("All connections closed");
                break;
            case "kill_master":
                if (connections.master) connections.master.disconnect();
                console.log("Master connection closed");
                break;
            case "kill_slaves":
                connections.slaves.forEach((slave) => slave.disconnect());
                console.log("Slave connections closed");
                break;
        }
    });
});
