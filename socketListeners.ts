import { io, connections } from "./index";
import {
    MasterEventTypes,
    SlaveEventTypes,
    SharedEventTypes,
} from "./types/SocketIOEvents";
import socketio from "socket.io";
let timeStamps = new Map();

export function masterSlaveCommands(socket: socketio.Socket) {
    socket.on(MasterEventTypes.ResetSlave, (msg: { slaveId: string }) => {
        if (socket.id === connections.master.id) {
            console.log("index.ts emitting slave reset");
            io.to(msg.slaveId).emit(SlaveEventTypes.Reset);
        }
    });

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
}

export function slaveBackgroundListeners(socket: socketio.Socket) {
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
}

export function synchronizationListeners(socket: socketio.Socket) {
    socket.on(SharedEventTypes.TimeSyncClient, (data: { t0: number }) => {
        socket.emit(SharedEventTypes.TimeSyncServer, {
            t1: Date.now(),
            t0: data.t0,
        });
    });

    socket.on(
        MasterEventTypes.NotifySlavesOfStartTimeCounter,
        (msg: { startTime: Date; slaveIds: Array<string> }) => {
            if (socket.id === connections.master.id) {
                console.log("Attempting to start timer by master");
                msg.slaveIds.forEach((id) => {
                    io.to(id).emit(SlaveEventTypes.SetCounterEvent, {
                        startTime: msg.startTime,
                    });
                });
            }
        }
    );
}

export function triangulationListeners(socket: socketio.Socket) {
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
    socket.on(
        MasterEventTypes.sendCutData,
        (msg: {
            slaveID: string;
            srcPoints: any;
            boundingBoxWidth: any;
            boundingBoxHeight: any;
        }) => {
            console.log(msg.srcPoints);
            console.log(msg.boundingBoxWidth);
            console.log(msg.boundingBoxHeight);
            io.to(msg.slaveID).emit(SlaveEventTypes.receiveCutData, msg);
        }
    );
    socket.on(
        MasterEventTypes.sendTriangulationData,
        (msg: { lines: any; points: any; slaveID: string }) => {
            io.to(msg.slaveID).emit(
                SlaveEventTypes.receiveTriangulationData,
                msg
            );
        }
    );
}

export function animationListeners(socket: socketio.Socket) {
    socket.on(
        MasterEventTypes.ShowAnimationOnSlave,
        (msg: {
            vector: any;
            position: any;
            start: any;
            end: any;
            slaveId: string;
        }) => {
            io.to(msg.slaveId).emit(SlaveEventTypes.showAnimation, msg);
            console.log("Hier geweest");
        }
    );

    socket.on(
        MasterEventTypes.startAnimation,
        (msg: { slaveIds: Array<string> }) => {
            console.log("Attempting to start timer by master");
            msg.slaveIds.forEach((id) => {
                io.to(id).emit(SlaveEventTypes.startAnimation, {
                    msg,
                });
            });
        }
    );

    socket.on(
        MasterEventTypes.stopAnimation,
        (msg: { slaveIds: Array<string> }) => {
            console.log("Attempting to start timer by master");
            msg.slaveIds.forEach((id) => {
                io.to(id).emit(SlaveEventTypes.stopAnimation, {
                    msg,
                });
            });
        }
    );
}

export function displayImageOnSlavesListeners(socket: socketio.Socket) {
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
}

export function videoListeners(socket: socketio.Socket) {
    socket.on(
        MasterEventTypes.StartVideoOnSlaves,
        (msg: {
            startTime: Date;
            slaveIds: Array<string>;
            videoUrl: string;
        }) => {
            console.log("Reached server: " + msg.videoUrl);
            if (socket.id === connections.master.id) {
                console.log("Attempting to start video by master");
                msg.slaveIds.forEach((id) => {
                    io.to(id).emit(SlaveEventTypes.StartVideo, {
                        startTime: msg.startTime,
                        videoUrl: msg.videoUrl,
                    });
                });
            }
        }
    );

    socket.on(
        MasterEventTypes.PauseVideoOnSlaves,
        (msg: { startTime: Date; slaveIds: Array<string> }) => {
            if (socket.id === connections.master.id) {
                console.log("socketListener pause video")
                msg.slaveIds.forEach((id) => {
                    io.to(id).emit(SlaveEventTypes.PauseVideo, {
                        startTime: msg.startTime,
                    });
                });
            }
        }
    );

    socket.on(
        MasterEventTypes.StopVideoOnSlaves,
        (msg: { startTime: Date; slaveIds: Array<string> }) => {
            if (socket.id === connections.master.id) {
                msg.slaveIds.forEach((id) => {
                    io.to(id).emit(SlaveEventTypes.StopVideo, {
                        startTime: msg.startTime,
                    });
                });
            }
        }
    );

    socket.on(
        MasterEventTypes.GetVideoTimeStampsOnSlaves,
        (msg: { startTime: Date; slaveIds: Array<string> }) => {
            if (socket.id === connections.master.id) {
                msg.slaveIds.forEach((id) => {
                    io.to(id).emit(SlaveEventTypes.GetVideoTimeStamp, {
                        startTime: msg.startTime,
                    });
                });
            }
        }
    );

    socket.on(
        MasterEventTypes.UpdateVideoTimeOnSlave,
        (msg: { deltaTime: number; slaveId: string }) => {
            if (socket.id === connections.master.id) {
                    io.to(msg.slaveId).emit(SlaveEventTypes.UpdateVideoTime, {
                        deltaTime: msg.deltaTime,
                    });
            }
        }
    );



}
