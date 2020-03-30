import express from "express";
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

console.log("Starting server...");

export const app = express();
const server = http.createServer(app);
export const io = socketio.listen(server, { pingTimeout: 60000 * 15 });

const port = process.env.PORT || "3000";

const staticFolder = path.resolve(__dirname + "/public");
const imgFolder = path.resolve(staticFolder + "/img");
export const htmlFolder = path.resolve(staticFolder + "/html");
const slaveImgUploadFolder = path.resolve(__dirname + "/server/uploads/slaves");

const connections: Connections = new Connections();

app.use(express.static(staticFolder));
app.use("/images", express.static(imgFolder));
app.use("/slave_images", express.static(slaveImgUploadFolder));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/sync_test_result", (req, res) => {
    const testResults: number[] = req.body;
    createCSV({
        fileName: "Sync_test",
        columnNames: ["Iteration", "Offset"],
        columnDatas: [
            Array(testResults.length)
                .fill(0)
                .map((_, i) => i),
            testResults,
        ],
    });
});

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

io.on("connect", (socket: socketio.Socket) => {
    connections.add(socket);

    socket.on("disconnect", () => {
        connections.remove(socket);
    });

    socket.on(SharedEventTypes.TimeSyncClient, (data: { t0: number }) => {
        socket.emit(SharedEventTypes.TimeSyncServer, {
            t1: Date.now(),
            t0: data.t0,
        });
    });

    socket.on(SlaveEventTypes.NotifyMasterThatPictureCanBeTaken, _ => {
        socket
            .to(connections.masterID)
            .emit(MasterEventTypes.HandleNextSlaveFlowHanlderStep, {});
    });

    socket.on(
        MasterEventTypes.ChangeSlaveBackgrounds,
        (msg: { [key: string]: string }) => {
            if (socket.id === connections.master.id) {
                console.log("Attempting to change background by master");
                for (const slaveId of Object.keys(msg)) {
                    io.to(slaveId).emit(SlaveEventTypes.ChangeBackground, {
                        color: msg[slaveId],
                    });
                }
            }
        }
    );

    socket.on(
        MasterEventTypes.ChangeSlaveBackground,
        (msg: {
            slaveId: string;
            color: { r: string; g: string; b: string };
        }) => {
            if (socket.id === connections.master.id) {
                console.log("Attempting to change background by master");
                io.to(msg.slaveId).emit(SlaveEventTypes.ChangeBackground, {
                    color: msg.color,
                });
            }
        }
    );

    socket.on(MasterEventTypes.ResetSlave, (msg: { slaveId: string }) => {
        if (socket.id === connections.master.id) {
            console.log("index.ts emitting slave reset");
            io.to(msg.slaveId).emit(SlaveEventTypes.Reset);
        }
    });

    socket.on(
        MasterEventTypes.DisplayImageOnSlave,
        (msg: { slaveId: string; imgUrl: string }) => {
            if (socket.id === connections.master.id) {
                console.log(
                    "Attempting to display image by master, imgurl: " +
                        msg.imgUrl
                );
                io.to(msg.slaveId).emit(SlaveEventTypes.DisplayImage, {
                    imgUrl: msg.imgUrl,
                });
            }
        }
    );

    socket.on(MasterEventTypes.GiveUpMaster, (msg: { slaveId?: string }) => {
        if (socket.id === connections.master.id) {
            console.log("Attempting to give up master");
            const slaveId = msg.slaveId;
            let socket = connections.getSocketFromId(slaveId);
            if (socket) {
                connections.changeMaster(socket);
            } else {
                connections.changeMaster(connections.slaves[0]);
            }
        }
    });

    socket.on(
        MasterEventTypes.NotifySlavesOfStartTimeCounter,
        (msg: { startTime: Date; slaveIds: Array<string> }) => {
            if (socket.id === connections.master.id) {
                console.log("Attempting to start timer by master");
                msg.slaveIds.forEach(id => {
                    io.to(id).emit(SlaveEventTypes.SetCounterEvent, {
                        startTime: msg.startTime,
                    });
                });
            }
        }
    );

    socket.on(
        MasterEventTypes.ToggleSlaveOrientationColors,
        (msg: {
            slaveId: string;
            leftTop: { r: string; g: string; b: string };
            rightTop: { r: string; g: string; b: string };
            leftBottom: { r: string; g: string; b: string };
            rightBottom: { r: string; g: string; b: string };
        }) => {
            if (socket.id === connections.master.id) {
                console.log("Attempting to change orientation by master");
                const { slaveId, ...slaveMsg } = msg;
                io.to(slaveId).emit(
                    SlaveEventTypes.ChangeOrientationColors,
                    slaveMsg
                );
            }
        }
    );

    socket.on(MasterEventTypes.SendArrowsUp, () => {
        if (socket.id === connections.master.id) {
            console.log("Attempting to display arrow by master");
            for (const slaveId of connections.slaveIDs) {
                io.to(slaveId).emit(SlaveEventTypes.DisplayArrowUp);
            }
        }
    });

    socket.on(MasterEventTypes.SendArrowsRight, () => {
        if (socket.id === connections.master.id) {
            console.log("Attempting to display arrow by master");
            for (const slaveId of connections.slaveIDs) {
                io.to(slaveId).emit(SlaveEventTypes.DisplayArrowRight);
            }
        }
    });

    socket.on(
        MasterEventTypes.SendTriangulationOnSlave,
        (msg: { slaveId: string; angles: any }) => {
            if (socket.id === connections.master.id) {
                io.to(msg.slaveId).emit(
                    SlaveEventTypes.DisplayTriangulationOnSlave,
                    msg
                );
            }
        }
    );

    //zijn overbodig
    // socket.on(
    //     MasterEventTypes.ShowAnimationOnSlave,
    //     (msg: {
    //         slaveId: string;
    //         startTime: any;
    //         animationLine: any;
    //         angles: any;
    //         lines: any;
    //         duration: any;
    //         last: any;
    //         next: any;
    //     }) => {
    //         if (socket.id === connections.master.id) {
    //             io.to(msg.slaveId).emit(SlaveEventTypes.showAnimation, msg);
    //         }
    //     }
    // );

    // socket.on(SlaveEventTypes.animationFinished, () => {
    //     console.log("dabbende steve, lit, u mama is so fat");
    //     io.to(connections.masterID).emit(MasterEventTypes.nextLine, {});
    // });

    // socket.on(
    //     MasterEventTypes.triangulationShow,
    //     (msg: { slaveId: string; angles: any; lines: any }) => {
    //         io.to(msg.slaveId).emit(SlaveEventTypes.linesShow, msg);
    //     }
    // );

    socket.on(
        MasterEventTypes.sendCutData,
        (msg: {
            slaveID: string;
            srcPoints: number;
            boundingBoxWidth: number;
            boundingBoxHeight: number;
        }) => {
            io.to(msg.slaveID).emit(SlaveEventTypes.receiveCutData, msg);
        }
    );

    socket.on(
        MasterEventTypes.sendTriangulationData,
        (msg: {
            lines: any;
            points: any;
            middlepoint: any;
            linkedMiddlePoints: any;
            slaveID: string;
        }) => {
            io.to(msg.slaveID).emit(SlaveEventTypes.receiveCutData, msg);
        }
    );

    socket.on(MasterEventTypes.startAnimation, (msg: { slaves: string[] }) => {
        msg.slaves.forEach(id => {
            io.to(id).emit(SlaveEventTypes.animationStateChange, {
                state: true,
            });
        });
    });

    socket.on(MasterEventTypes.stopAnimation, (msg: { slaves: string[] }) => {
        msg.slaves.forEach(id => {
            io.to(id).emit(SlaveEventTypes.animationStateChange, {
                state: false,
            });
        });
    });

    socket.on(
        MasterEventTypes.nextLine,
        (msg: {
            passingSlaves: {
                point: { x: number; y: number };
                slaveId: string;
            }[];
            currPos: { x: number; y: number };
            endPos: { x: number; y: number };
        }) => {
            io.to(msg.passingSlaves[0].slaveId).emit(
                SlaveEventTypes.showAnimation,
                msg
            );
        }
    );
});

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
    startListeningForServerCommands(input => {
        switch (input) {
            case "kill_all":
                connections.slaves.forEach(slave => slave.disconnect());
                if (connections.master) connections.master.disconnect();
                console.log("All connections closed");
                break;
            case "kill_master":
                if (connections.master) connections.master.disconnect();
                console.log("Master connection closed");
                break;
            case "kill_slaves":
                connections.slaves.forEach(slave => slave.disconnect());
                console.log("Slave connections closed");
                break;
        }
    });
});
