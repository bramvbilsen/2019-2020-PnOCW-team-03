import { ConnectionType } from "../types/ConnectionType";
import {
    SharedEventTypes,
    SlaveEventTypes,
    MasterEventTypes,
} from "../types/SocketIOEvents";
import { IRGBAColor } from "../types/Color";
import env from "../../env/env";
import Sync from "../util/Sync";
import delauney from "../image_processing/Triangulation/Delaunay";
import { client, slaveFlowHandler } from "../../index";
import Point from "../image_processing/screen_detection/Point";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import Line from "../image_processing/screen_detection/Line";
import { BoundingBox } from "../util/BoundingBox";
import { flattenOneLevel } from "../util/arrays";
import SlaveScreen from "../util/SlaveScreen";
import Triangulation from "../image_processing/Triangulation/Triangulation";
import { loadImage, loadVideo } from "../util/images";
import { wait } from "../image_processing/SlaveFlowHandler";
import { CornerLabels } from "../types/Points";
import { colortest } from "../../tests/color_detection/colorTesting";
import p5 from "p5";
import ClientStorage from "./ClientStorage";
import Animation from "./Animation";
//import "p5/lib/addons/p5.dom";

const {
    checkIntersection,
    colinearPointWithinSegment,
} = require("line-intersect");

class Client {
    private _type: ConnectionType;
    public _slaves: Array<string> = [];
    //create map for timestamps
    private timeStamps = new Map();
    private interval: any;
    private _socketIOEmitters: Array<SocketIOClient.Emitter> = [];
    private _socket: SocketIOClient.Socket;
    private _sync: Sync;
    public onConnectionTypeChange: (connectionType: ConnectionType) => void;
    public DEBUG: boolean = false;
    public cutWithRealPoints: boolean = false;
    public bouncingBallImg: HTMLImageElement;
    private currentNb = 11;
    private startAnimationTime: number;
    private clientStorage: ClientStorage;
    public animation: Animation;

    /**
     * Color that the user wants to display on the slave.
     * Only applicable for masters.
     */
    // Pink
    public color: IRGBAColor = {
        r: 255,
        g: 70,
        b: 181,
        a: 100,
    };
    // Blue
    // public color: IRGBAColor = {
    //     r: 0,
    //     g: 0,
    //     b: 255,
    //     a: 100,
    // };

    constructor(args: {
        onConnectionTypeChange: (connectionType: ConnectionType) => void;
    }) {
        this.clientStorage = new ClientStorage();
        this.onConnectionTypeChange = args.onConnectionTypeChange;
        this._socket = io.connect(env.baseUrl);
        this._socket.on("connected", () => console.log("Connected!"));

        this._sync = new Sync(this._socket);

        loadImage(`${env.baseUrl}/images/ball.gif`).then(
            (img) => (this.bouncingBallImg = img)
        );

        this._socket.on(
            SharedEventTypes.NotifyOfTypeChange,
            (data: { type: ConnectionType }) => {
                this._type = data.type;
                this._slaves = [];
                this.animation = new Animation(this);
                this.removeNewSocketIOEmitters();
                const socketIOEmittersForNewType: Array<SocketIOClient.Emitter> = [];
                if (this.type === ConnectionType.SLAVE) {
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            SlaveEventTypes.ChangeBackground,
                            this.changeBackground
                        ),
                        this._socket.on(SlaveEventTypes.Reset, this.reset),
                        this._socket.on(
                            SlaveEventTypes.SetCounterEvent,
                            this.startCounterEvent
                        ),
                        this._socket.on(
                            SlaveEventTypes.ChangeOrientationColors,
                            this.toggleOrientationColors
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayImage,
                            this.displayImage
                        ),
                        this._socket.on(
                            SlaveEventTypes.StartVideo,
                            this.startVideoEvent
                        ),
                        this._socket.on(
                            SlaveEventTypes.PauseVideo,
                            this.pauseVideoEvent
                        ),
                        this._socket.on(
                            SlaveEventTypes.StopVideo,
                            this.stopVideoEvent
                        ),
                        this._socket.on(
                            SlaveEventTypes.GetVideoTimeStamp,
                            this.returnVideoTimeStamp
                        ),
                        this._socket.on(
                            SlaveEventTypes.UpdateVideoTime,
                            this.updateVideoTime
                        ),
                        this._socket.on(
                            SlaveEventTypes.receiveCutData,
                            this.receiveCutData
                        ),
                        this._socket.on(
                            SlaveEventTypes.receiveTriangulationData,
                            this.receiveTriangulationData
                        ),
                        this._socket.on(
                            SlaveEventTypes.showAnimation,
                            this.showAnimation
                        ),
                        this._socket.on(
                            SlaveEventTypes.startAnimation,
                            this.startAnimation
                        ),
                        this._socket.on(
                            SlaveEventTypes.stopAnimation,
                            this.stopAnimation
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayDetectionColor,
                            this.displayColor
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayOrientationColors,
                            this.displayOrientationColors
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayTrackingScreen,
                            this.displayTrackingWindow
                        )
                    );
                } else {
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            MasterEventTypes.SlaveChanges,
                            this.handleSlaveChanges
                        ),
                        this._socket.on(
                            MasterEventTypes.HandleVideoTimeStampsOnSlaves,
                            this.handleVideoTimeStamp
                        )
                    );
                }
                this.setNewSocketIOEmitters(socketIOEmittersForNewType);
                this.onConnectionTypeChange(this.type);
            }
        );
    }

    /**
     * @returns Difference in time between server and client
     */
    get serverTimeDiff(): number {
        return this._sync.timeDiff;
    }

    /**
     * @returns `ConnectionType.MASTER` if client is master.
     * @returns `ConnectionType.SLAVE` if client is slave.
     */
    get type(): ConnectionType {
        return this._type;
    }

    /**
     * @returns an array the slave IDs if master.
     * @returns an empty array if slave.
     */
    get slaves(): Array<string> {
        return this._slaves;
    }

    /**
     * @returns wheter current client is connected with socketIO connection.
     */
    get connected(): boolean {
        return this._socket.connected;
    }

    /**
     * @returns the ID of the socket; matches the server ID and is set when we're connected,
     * 	and cleared when we're disconnected
     */
    get id(): string {
        return this._socket.id;
    }

    /**
     * Sends a request to the server to change the background color of the slave.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showColorOnSlave = (
        slaveId: string,
        colorToDisplay?: IRGBAColor
    ) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        const { a, ...color } = this.color;
        this._socket.emit(MasterEventTypes.ChangeSlaveBackground, {
            slaveId,
            color: colorToDisplay || color,
        });
    };

    public resetSlave = (slaveId: string) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        console.log("changing slaves to default state: from master");
        this._socket.emit(MasterEventTypes.ResetSlave, {
            slaveId,
        });
    };

    /**
     * Sends a request to the server to change the orientation colors of the slave.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public toggleOrientationColorsOnSlave = (slaveId: string) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }

        this._socket.emit(MasterEventTypes.ToggleSlaveOrientationColors, {
            slaveId,
        });
    };

    /**
     * Sends request to slave to display image.
     */
    public showImgOnSlave = (slaveId: string, imgUrl: string) => {
        // Create test canvas for test purposes
        this._socket.emit(MasterEventTypes.DisplayImageOnSlave, {
            slaveId,
            imgUrl,
        });
    };

    /**
     * Passes master to the slave that connected after the master or to the slave with `slaveId` if provided.
     * @argument slaveId
     */
    public giveUpMaster(slaveId?: string) {
        this._socket.emit(MasterEventTypes.GiveUpMaster, { slaveId });
    }

    /**
     * Sets the list of given SocketIOClient.Emitter as the new emitters.
     */
    private setNewSocketIOEmitters = (
        newEmitters: Array<SocketIOClient.Emitter>
    ) => {
        this._socketIOEmitters = newEmitters;
    };

    /**
     * Removes the current list of emitters.
     * The list gets reset to an empty array.
     */
    private removeNewSocketIOEmitters = () => {
        Object.keys(MasterEventTypes).forEach(
            (key: keyof typeof MasterEventTypes) => {
                const eventType: string = MasterEventTypes[key];
                this._socket.off(eventType);
            }
        );
        Object.keys(SlaveEventTypes).forEach(
            (key: keyof typeof SlaveEventTypes) => {
                const eventType: string = SlaveEventTypes[key];
                this._socket.off(eventType);
            }
        );
        this._socketIOEmitters = [];
    };

    /**
     * Changes the actual background to the given color.
     */
    private changeBackground = (data: {
        color: { r: number; g: number; b: number };
    }): void => {
        if (Number(document.getElementById("pink-color").style.zIndex) == 1) {
            this.hideAllSlaveLayers();
            this.moveToForeground("default-slave-state");
        } else {
            this.hideAllSlaveLayers();
            this.moveToForeground("pink-color");
            this.notifyMasterThatPictureCanBeTaken();
        }
    };

    /**
     * Makes the orientation colours (in)visible.
     */
    private toggleOrientationColors = (): void => {
        if (
            Number(
                document.getElementById("orientation-colors").style.zIndex
            ) == 1
        ) {
            this.hideAllSlaveLayers();
            this.moveToForeground("default-slave-state");
        } else {
            this.hideAllSlaveLayers();
            this.moveToForeground("orientation-colors");
            this.notifyMasterThatPictureCanBeTaken();
        }
    };

    private reset = (): void => {
        this.hideAllSlaveLayers();
        this.moveToForeground("default-slave-state");
        console.log("changing to default state: from client.ts in slave");
    };

    /**
     * Displays the given image on the slave.
     */
    private displayImage = (data: { imgUrl: string }): void => {
        console.log("DISPLAYING IMAGE: " + data.imgUrl);
        loadImage(data.imgUrl + "?" + Math.random()).then((img) => {
            const canvas = createCanvas(
                this.clientStorage.boundingBoxWidth,
                this.clientStorage.boundingBoxHeight
            );
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
                img,
                0,
                0,
                img.width,
                img.height,
                0,
                0,
                this.clientStorage.boundingBoxWidth,
                this.clientStorage.boundingBoxHeight
            );
            const srcPoints = this.clientStorage.srcPoints;
            canvas.style.transform = this.clientStorage.matrix3d;
            canvas.style.transformOrigin = "0 0";
            const parent = document.getElementById("image-container-slave");
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
            document
                .getElementById("image-container-slave")
                .appendChild(canvas);
            this.hideAllSlaveLayers();
            this.moveToForeground("image-container-slave");
        });
    };

    public hideAllSlaveLayers() {
        $("#default-slave-state").css("z-index", -2);
        $("#pink-color").css("z-index", -2);
        $("#orientation-colors").css("z-index", -2);
        $("#image-container-slave").css("z-index", -2);
        $("#video-container-slave").css("z-index", -2);
    }
    public moveToForeground(elemName: string) {
        $("#" + elemName).css("z-index", 1);
    }

    public moveToBackground(elemName: string) {
        $("#" + elemName).css("z-index", -1);
    }

    /**
     * Emit to each slave the starttime of the counter (10 seconds ahead from now).
     * Each slave gets the server time plus or minus its own delay.
     */
    public notifySlavesOfStartTimeCounter = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
        } else {
            let startTime = new Date().getTime() + 3000;
            let slaveIds = this.slaves;
            this._socket.emit(MasterEventTypes.NotifySlavesOfStartTimeCounter, {
                startTime,
                slaveIds,
            });
        }
    };

    /**
     * Creates a countdown visual
     */
    public countdownSketch = (p: p5) => {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let particles: any = [];
        let countdownFinished = false;

        const initCountdown = () => {
            console.log(this);
            this.currentNb = 11;
            this.startAnimationTime = performance.now();
        };

        /**
         * Source: https://codepen.io/Kourga/pen/EoaKqQ
         */
        class Particle {
            pos: p5.Vector;
            vel: p5.Vector;
            acc: p5.Vector;
            r: any;
            halfr: number;

            constructor(x: number, y: number, r: number) {
                this.pos = p.createVector(x, y);
                this.vel = p.createVector(p.random(-5, 5), p.random(-5, 5));
                this.acc = p.createVector(0, 0);
                this.r = r ? r : 48;
                this.halfr = r / 2;
            }

            applyForce(force: p5.Vector) {
                this.acc.add(force);
            }

            update() {
                this.vel.add(this.acc);
                this.pos.add(this.vel);
                this.acc.set(0, 0);
            }

            display() {
                p.noStroke();
                p.fill(255);
                p.ellipse(this.pos.x, this.pos.y, this.r, this.r);
            }

            edges() {
                if (this.pos.y > p.height - this.halfr) {
                    this.vel.y *= -1;
                    this.pos.y = p.height - this.halfr;
                }

                if (this.pos.y < 0 + this.halfr) {
                    this.vel.y *= -1;
                    this.pos.y = 0 + this.halfr;
                }

                if (this.pos.x > p.width - this.halfr) {
                    this.vel.x *= -1;
                    this.pos.x = p.width - this.halfr;
                }

                if (this.pos.x < this.halfr) {
                    this.vel.x /= -1;
                    this.pos.x = this.halfr;
                }
            }
        }

        p.setup = () => {
            const fps = 30; // TODO: pas aan
            p.frameRate(fps);
            const p5Canvas = p.createCanvas(windowWidth, windowHeight);
            p5Canvas.id("fullScreen");
            this.hideAllSlaveLayers();
            this.moveToForeground("fullScreen");

            initCountdown();
        };

        p.draw = () => {
            p.clear();
            let elapsedTime = performance.now() - this.startAnimationTime;
            this.currentNb = Math.floor(10 - elapsedTime / 1000);
            if (this.currentNb <= 0) {
                if (!countdownFinished) {
                    p.noLoop();
                    countdownFinished = true;
                    p.loop();
                }
                drawExplosion();
            } else {
                drawNb();
            }
            if (this.currentNb < -7) {
                p.noLoop();
                this.hideAllSlaveLayers();
                this.moveToForeground("default-slave-state");
                $("#fullScreen").remove();
            }
        };

        const drawNb = () => {
            console.log("CountDown: " + this.currentNb);
            // p.stroke(0, 0, 0, 0); // TODO
            p.fill(p.color(255, 255, 255));
            p.background("#0000ff");
            p.textSize(80);
            p.text(
                this.currentNb.toString(),
                Math.floor(windowWidth / 2),
                Math.floor(windowHeight / 2),
                70,
                80
            );
        };

        const drawExplosion = () => {
            var i = 0;
            setInterval(function () {
                if (i <= 150) {
                    particles[i] = new Particle(
                        p.width / 2,
                        p.height / 2,
                        p.random(3, 35)
                    );
                    i++;
                }
            }, 15);

            p.background("#0000ff");

            var gravity = p.createVector(0, 0.05);
            var wind = p.createVector(0.09, 0);

            if (particles.length > 0) {
                for (var i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].display();
                }
            }
        };
    };

    /**
     * Starts a countdown event.
     */
    private startCounterEvent = (msg: { startTime: number }): void => {
        // Destroy the counter div
        // console.log("Destroy");
        // const oldCanvas = document.getElementById("countdownCanvas");
        // if (oldCanvas) {
        //     oldCanvas.remove();
        // }
        const eta_ms = msg.startTime + this._sync.timeDiff - Date.now();
        setTimeout(() => {
            new p5(this.countdownSketch);
        }, eta_ms);
    };

    /**
     * Emit to each slave the starttime of the video (10 seconds ahead from now).
     * Each slave gets the server time plus or minus its own delay.
     */
    public startVideoOnSlaves = (videoUrl: string) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO start video.\nNot executing command!"
            );
        } else {
            let startTime = new Date().getTime() + 2500;
            let slaveIds = this.slaves;
            this.syncVideoOnSlaves();
            this._socket.emit(MasterEventTypes.StartVideoOnSlaves, {
                startTime,
                slaveIds,
                videoUrl,
            });
        }
    };

    /**
     * Starts the syncing process of the video, does this every six seconds
     */
    public syncVideoOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO start video.\nNot executing command!"
            );
        } else {
            console.log("sync is starting");
            this.interval = setInterval(this.sync, 3000);
        }
    };

    /**
     * sending request to the slaves to get their current timestamp of video
     */
    public sync = () => {
        let startTime = new Date().getTime() + 2300;
        let slaveIds = this.slaves;
        this._socket.emit(MasterEventTypes.GetVideoTimeStampsOnSlaves, {
            startTime,
            slaveIds,
        });
    };

    public stopSyncVideoOnSlaves = () => {
        console.log("stopping video sync");
        clearInterval(this.interval);
    };

    /**
     * Slave side: send the video timeStamp to the master
     */
    //TODO: Gather all slave messages and handle all this data on master side
    public returnVideoTimeStamp = (msg: {
        startTime: number;
        id: string;
    }): void => {
        const video: HTMLVideoElement = <HTMLVideoElement>(
            document.getElementById("video-slave")
        );

        const eta_ms = msg.startTime + this._sync.timeDiff - Date.now();
        setTimeout(() => {
            console.log(
                "slave is sending out timestamp" +
                    " " +
                    video.currentTime +
                    " " +
                    this._socket.id
            );
            let timeStamp = video.currentTime;
            this._socket.emit(SlaveEventTypes.sendVideoTimeStamp, {
                timeStamp,
                id: msg.id,
            });
        }, eta_ms);
    };

    /**
     * handle the videoStamp returned by the slaves, using a map/list
     * calculate the difference between each slave and the furthest one
     * send the individual difference to each slave
     *
     */
    public handleVideoTimeStamp = (msg: {
        timeStamp: number;
        id: string;
    }): void => {
        console.log("handling timestamp from" + msg.id);
        this.timeStamps.set(msg.id, msg.timeStamp);
        if (this.timeStamps.size == this.slaves.length) {
            console.log("all clients sent in timestamp");
            let highest = 0;
            for (let [key, value] of this.timeStamps.entries()) {
                console.log(key, value);
                if (value > highest) {
                    highest = value;
                }
            }

            for (let [key, value] of this.timeStamps.entries()) {
                let deltaTime = highest - value;
                this._socket.emit(MasterEventTypes.UpdateVideoTimeOnSlave, {
                    deltaTime,
                    id: key,
                });
            }

            this.timeStamps.clear();
        }
    };
    /**
     * Update time of video so that all clients are synced
     *
     */
    public updateVideoTime = (msg: { deltaTime: number }): void => {
        const video: HTMLVideoElement = <HTMLVideoElement>(
            document.getElementById("video-slave")
        );
        console.log("slave is updating video frame to stay synced");
        video.currentTime = video.currentTime + msg.deltaTime;
    };

    /**
     * Master PauseVideoOn
     * @constructor
     */
    public PauseVideoOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO pause video.\nNot executing command!"
            );
        } else {
            let startTime = new Date().getTime() + 2500;
            let slaveIds = this.slaves;
            this._socket.emit(MasterEventTypes.PauseVideoOnSlaves, {
                startTime,
                slaveIds,
            });
        }
    };

    public StopVideoOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO stop video.\nNot executing command!"
            );
        } else {
            let slaveIds = this.slaves;
            this._socket.emit(MasterEventTypes.StopVideoOnSlaves, {
                slaveIds,
            });
            this.stopSyncVideoOnSlaves();
        }
    };

    /**
     * Command for starting video clientside
     * @param msg
     */
    private startVideoEvent = (msg: {
        startTime: number;
        videoUrl: string;
    }): void => {
        //Hier code van synchronisatie elke 5 sec
        this.hideAllSlaveLayers();
        this.moveToForeground("video-container-slave");

        const video: HTMLVideoElement = <HTMLVideoElement>(
            document.getElementById("video-slave")
        );
        console.log("Reached client: " + msg.videoUrl);

        video.width = this.clientStorage.boundingBoxWidth;
        video.height = this.clientStorage.boundingBoxHeight;
        video.style.transform = this.clientStorage.matrix3d;
        video.style.transformOrigin = "0 0";

        const eta_ms = msg.startTime + this._sync.timeDiff - Date.now();
        setTimeout(() => {
            video.play();
        }, eta_ms);
    };

    /**
     * Stops the video event
     */
    private stopVideoEvent = (): void => {
        const video: HTMLVideoElement = <HTMLVideoElement>(
            document.getElementById("video-slave")
        );
        video.pause();
        video.currentTime = 0;

        this.hideAllSlaveLayers();
        this.moveToForeground("default-slave-state");
    };

    /**
     * Pauses the video event
     */
    private pauseVideoEvent = (msg: { startTime: number }): void => {
        const video: HTMLVideoElement = <HTMLVideoElement>(
            document.getElementById("video-slave")
        );
        console.log("toggling video");
        if (!video.paused) {
            const eta_ms = msg.startTime + this._sync.timeDiff - Date.now();
            setTimeout(() => {
                video.pause();
            }, eta_ms);
        } else {
            const eta_ms = msg.startTime + this._sync.timeDiff - Date.now();
            setTimeout(() => {
                video.play();
            }, eta_ms);
        }
    };

    /**
     * Updates the displayed number of slaves on the master.
     */
    private handleSlaveChanges = (data: { slaves: Array<string> }) => {
        this._slaves = data.slaves;
        $("#welcome-master-connected-slaves-amt").text(data.slaves.length);
    };

    /**
     * Notifies the master that the slave is ready for a picture.
     */
    public notifyMasterThatPictureCanBeTaken = () => {
        this._socket.emit(
            SlaveEventTypes.NotifyMasterThatPictureCanBeTaken,
            {}
        );
    };

    /**
     * Notifies the master that a creeper can now be displayed.
     */
    public notifyMasterThatCreeperCanStart = () => {
        this._socket.emit(SlaveEventTypes.NotifyMasterThatCreeperCanStart, {});
    };

    /**
     * Sends the information about the screen/image distribution to the server.
     */
    public sendCutData = (
        srcPoints: {
            LeftUp: { x: number; y: number };
            RightUp: { x: number; y: number };
            LeftUnder: { x: number; y: number };
            RightUnder: { x: number; y: number };
        },
        boundingBoxWidth: number,
        boundingBoxHeight: number,
        slaveID: string
    ) => {
        this._socket.emit(MasterEventTypes.sendCutData, {
            slaveID,
            srcPoints,
            boundingBoxWidth,
            boundingBoxHeight,
        });
    };

    /**
     * Sets the received information about the screen/image distribution in the ClientStorage
     */
    public receiveCutData = (msg: {
        srcPoints: {
            LeftUp: { x: number; y: number };
            RightUp: { x: number; y: number };
            LeftUnder: { x: number; y: number };
            RightUnder: { x: number; y: number };
        };
        boundingBoxWidth: number;
        boundingBoxHeight: number;
    }) => {
        console.log("boundingbox shit");
        console.log(msg.boundingBoxWidth);
        console.log(msg.boundingBoxHeight);
        this.clientStorage.newData(
            msg.boundingBoxWidth,
            msg.boundingBoxHeight,
            msg.srcPoints
        );
    };

    /**
     * Sends the information about the screen/image distribution to the server.
     */
    public sendTriangulationData = (
        lines: { x1: number; y1: number; x2: number; y2: number }[],
        points: { x: number; y: number }[],
        slaveID: string
    ) => {
        this._socket.emit(MasterEventTypes.sendTriangulationData, {
            lines,
            points,
            slaveID,
        });
    };

    /**
     * Sets the received information about the screen/image distribution in the ClientStorage
     */
    public receiveTriangulationData = (msg: {
        lines: { x1: number; y1: number; x2: number; y2: number }[];
        points: { x: number; y: number }[];
    }) => {
        this.clientStorage.addTriangulation(msg.lines, msg.points);
    };

    public startAnimation = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.log("koekoek");
            this.clientStorage.startAnimation();
        }
        if (this.type === ConnectionType.MASTER) {
            let slaveIds = this.slaves;
            this._socket.emit(MasterEventTypes.startAnimation, {
                slaveIds,
            });
            this.animation.animate();
        }
    };

    public stopAnimation = () => {
        if (this.type === ConnectionType.SLAVE) {
            this.clientStorage.stopAnimation();
        }
        if (this.type === ConnectionType.MASTER) {
            let slaveIds = this.slaves;
            this._socket.emit(MasterEventTypes.stopAnimation, {
                slaveIds,
            });
            this.animation.stop();
        }
    };

    public sendAnimation = (
        vector: { x: number; y: number },
        position: { x: number; y: number },
        start: number,
        end: number,
        slaveId: string
    ) => {
        this._socket.emit(MasterEventTypes.ShowAnimationOnSlave, {
            vector,
            position,
            start,
            end,
            slaveId,
        });
    };

    public showAnimation = (msg: {
        vector: { x: number; y: number };
        position: { x: number; y: number };
        start: number;
        end: number;
    }) => {
        const startTime = (msg.start += this.serverTimeDiff);
        const endTime = (msg.end += this.serverTimeDiff);
        const position = new Point(msg.position.x, msg.position.y);
        const vector = new Point(msg.vector.x, msg.vector.y);
        this.clientStorage.animate(startTime, endTime, position, vector);
        console.log("Animation ontvangen");
    };

    public displayColor = (msg: { color: IRGBAColor }) => {
        requestAnimationFrame(() => {
            document.getElementById(
                "slave"
            ).style.backgroundColor = `rgb(${msg.color.r},${msg.color.g},${msg.color.b})`;
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this._socket.emit(SlaveEventTypes.DisplayedDetectionColor);
                }, 1000);
            });
        });
    };

    public requestColor = (color: IRGBAColor, slaveID: string) => {
        return new Promise((resolve, reject) => {
            this._socket.on(MasterEventTypes.ConfirmedDetectionColor, () => {
                this._socket.off(MasterEventTypes.ConfirmedDetectionColor);
                resolve();
            });
            this._socket.emit(MasterEventTypes.RequestDetectionColor, {
                color,
                slaveID,
            });
        });
    };

    private displayOrientationColors = (): void => {
        requestAnimationFrame(() => {
            this.hideAllSlaveLayers();
            this.moveToForeground("orientation-colors");
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this._socket.emit(
                        SlaveEventTypes.DisplayedOrientationColors
                    );
                }, 1000);
            });
        });
    };

    public requestOrientationColors = (slaveIDs: string[]) => {
        return new Promise((resolve, reject) => {
            this._socket.on(MasterEventTypes.ConfirmedOrientationColors, () => {
                this._socket.off(MasterEventTypes.ConfirmedOrientationColors);
                resolve();
            });
            this._socket.emit(MasterEventTypes.RequestOrientationColors, {
                slaveIDs,
            });
        });
    };

    public requestTrackingScreen = (
        slaveID: String
    ): Promise<{ screenInnerWidth: number; screenInnerHeight: number }> => {
        return new Promise((resolve, reject) => {
            this._socket.on(
                MasterEventTypes.ConfirmedTrackingScreen,
                (msg: {
                    screenInnerWidth: number;
                    screenInnerHeight: number;
                }) => {
                    this._socket.off(MasterEventTypes.ConfirmedTrackingScreen);
                    resolve({
                        screenInnerWidth: msg.screenInnerWidth,
                        screenInnerHeight: msg.screenInnerHeight,
                    });
                }
            );
            this._socket.emit(MasterEventTypes.RequestTrackingScreen, {
                slaveID,
            });
        });
    };

    public displayTrackingWindow = () => {
        requestAnimationFrame(() => {
            this.hideAllSlaveLayers();
            this.moveToForeground("tracking-container-slave");
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this._socket.emit(SlaveEventTypes.DisplayedTrackingScreen, {
                        screenInnerWidth: innerWidth,
                        screenInnerHeight: innerHeight,
                    });
                }, 1000);
            });
        });
    };
}

export default Client;
