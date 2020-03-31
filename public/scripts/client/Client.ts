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
import { loadImage } from "../util/images";
import { wait } from "../image_processing/SlaveFlowHandler";
import { CornerLabels } from "../types/Points";
import { colortest } from "../../tests/color_detection/colorTesting";
import p5 from "p5";
import ClientStorage from "./ClientStorage";
import "p5/lib/addons/p5.dom";

const {
    checkIntersection,
    colinearPointWithinSegment,
} = require("line-intersect");

class Client {
    private _type: ConnectionType;
    public _slaves: Array<string> = [];
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
            img => (this.bouncingBallImg = img)
        );

        this._socket.on(
            SharedEventTypes.NotifyOfTypeChange,
            (data: { type: ConnectionType }) => {
                this._type = data.type;
                this._slaves = [];
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
                            SlaveEventTypes.StopVideo,
                            this.stopVideoEvent
                        )
                        //DEZE SOCKETS ZIJN GESLOTEN
                        // this._socket.on(
                        //     SlaveEventTypes.DisplayTriangulationOnSlave,
                        //     this.showTriangulation
                        // ),
                        // this._socket.on(
                        //     SlaveEventTypes.showAnimation,
                        //     this.showAnimation
                        // ),
                        // this._socket.on(
                        //     SlaveEventTypes.linesShow,
                        //     this.linesShow
                        // ),
                        this._socket.on(
                            SlaveEventTypes.receiveCutData,
                            this.receiveCutData
                        ),

                        this._socket.on(
                            SlaveEventTypes.receiveTriangulationData,
                            this.receiveTriangulationData
                        ),

                        this._socket.on(
                            SlaveEventTypes.animationStateChange,
                            this.changeAniamtionState
                        ),

                        this._socket.on(
                            SlaveEventTypes.showAnimation,
                            this.animate
                        )
                    );
                } else {
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            MasterEventTypes.SlaveChanges,
                            this.handleSlaveChanges
                        )
                    );
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            MasterEventTypes.HandleNextSlaveFlowHanlderStep,
                            this.handleNextSlaveFlowHandlerStep
                        )
                    );
                    // socketIOEmittersForNewType.push(
                    //     this._socket.on(
                    //         MasterEventTypes.nextLine,
                    //         this.nextlinesend
                    //     )
                    // );
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
        // TODO:  colors are not necessary any more.
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
        loadImage(data.imgUrl + "?" + Math.random()).then(img => {
            const canvas = createCanvas(
                this.clientStorage.boundingBoxWidth,
                this.clientStorage.boundingBoxWidth
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
            canvas.style.clipPath =
                "polygon(" +
                srcPoints.LeftUp.x +
                "px " +
                srcPoints.LeftUp.y +
                "px, " +
                srcPoints.RightUp.x +
                "px " +
                srcPoints.RightUp.y +
                "px, " +
                srcPoints.RightUnder.x +
                "px " +
                srcPoints.RightUnder.y +
                "px, " +
                srcPoints.LeftUnder.x +
                "px " +
                srcPoints.LeftUnder.y +
                "px)";
            canvas.style.transform = this.clientStorage.matrix3d;
            canvas.style.transformOrigin = "0 0";
            $("#image-slave").attr("src", canvas.toDataURL());
            this.hideAllSlaveLayers();
            this.moveToForeground("image-container-slave");
            //document.getElementsByTagName("body")[0].appendChild(canvas);
            // $("#image-slave").css("transform", this.clientStorage.matrix3d);
            // $("#image-slave").css("transform-origin", "0 0");
            // $("#image-slave").attr("src", canvas.toDataURL());
        });
    };

    public hideAllSlaveLayers() {
        $("#default-slave-state").css("z-index", -2);
        $("#pink-color").css("z-index", -2);
        $("#orientation-colors").css("z-index", -2);
        $("#image-container-slave").css("z-index", -2);
    }
    public moveToForeground(elemName: string) {
        $("#" + elemName).css("z-index", 1);
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
            let startTime = new Date().getTime() + 10000;
            let slaveIds = this.slaves;
            this._socket.emit(MasterEventTypes.NotifySlavesOfStartTimeCounter, {
                startTime,
                slaveIds,
            });
        }
    };

    /**
     * Creates a countdown visual?
     */
    public countdownSketch = (p: p5) => {
        let windowWidth = 500;
        let windowHeight = 800;

        const initCountdown = () => {
            console.log(this);
            this.currentNb = 11;
            this.startAnimationTime = performance.now();
        };

        p.setup = function() {
            const fps = 30; // TODO: pas aan
            p.frameRate(fps);
            const p5Canvas = p.createCanvas(windowWidth, windowHeight);
            p5Canvas.id("fullScreen");

            initCountdown();
        };

        p.draw = () => {
            p.clear();
            let elapsedTime = performance.now() - this.startAnimationTime;
            this.currentNb = Math.floor(10 - elapsedTime / 1000);
            if (this.currentNb <= 0) {
                p.noLoop(); // TODO: maybe clear the canvas when -1 ?
                $("#fullScreen").remove();
            }
            drawNb();
        };

        const drawNb = () => {
            console.log("CountDown: " + this.currentNb);
            // p.stroke(0, 0, 0, 0); // TODO
            p.fill(50);
            p.textSize(50);
            p.text(
                this.currentNb.toString(),
                Math.floor(windowWidth / 2),
                Math.floor(windowHeight / 2),
                70,
                80
            );
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
        const eta_ms = msg.startTime - Date.now();
        setTimeout(() => {
            new p5(this.countdownSketch);
        }, eta_ms);
    };


    /**
     * Draw the video on client
     * TODO: PJ en Bas
     */
    public videoDisplaySketch = (p: p5) => {
        function initVideo(video : p5.MediaElement){
            video.loop();
            video.volume(0);


        }
        /**
        const initVideo= function() => {
            video.loop();
            video.volume(0);
        };
         */

        p.setup = function() {
            const fps = 30;
            p.frameRate(fps);
            p.noCanvas();
            let video = p.createVideo(['Zet hier in path naar video'], initVideo);
            //video 100% displayen, dus geen size oproepen
            initVideo(video);
        };

    }


    /**
     * Starts the video event
     */
    private startVideoEvent = (msg: { startTime: number }): void => {
        //Hier code van synchronisatie elke 5 sec
        const eta_ms = msg.startTime - Date.now();
        setTimeout(() => {
            new p5(this.videoDisplaySketch);
        }, eta_ms);
    };

    /**
     * Continuous sync of videos, HOWTO?
     */
    public syncVideoEvents(video: p5.MediaElement){
        //video.speed()
    }


    /**
     * Updates the displayed number of slaves on the master.
     */
    private handleSlaveChanges = (data: { slaves: Array<string> }) => {
        this._slaves = data.slaves;
        $("#welcome-master-connected-slaves-amt").text(data.slaves.length);
    };

    /**
     * Go to the next step in the current `SlaveFlowHandler`
     */
    public handleNextSlaveFlowHandlerStep = async (_: any) => {
        if (slaveFlowHandler) {
            await slaveFlowHandler.nextStep();
        }
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
        middlepoint: { x: number; y: number },
        linkedMiddlePoints: {
            linkedLine: {
                point: { x: number; y: number };
                slaveId: string;
            }[];
            linkedMiddlePoint: { x: number; y: number };
        }[],
        slaveID: string
    ) => {
        this._socket.emit(MasterEventTypes.sendTriangulationData, {
            lines,
            points,
            middlepoint,
            linkedMiddlePoints,
            slaveID,
        });
    };

    /**
     * Sets the received information about the screen/image distribution in the ClientStorage
     */
    public receiveTriangulationData = (msg: {
        lines: { x1: number; y1: number; x2: number; y2: number }[];
        points: { x: number; y: number }[];
        middlepoint: { x: number; y: number };
        linkedMiddlePoints: {
            linkedLine: {
                point: { x: number; y: number };
                slaveId: string;
            }[];
            linkedMiddlePoint: { x: number; y: number };
        }[];
    }) => {
        this.clientStorage.addTriangulation(
            msg.lines,
            msg.points,
            msg.middlepoint,
            msg.linkedMiddlePoints
        );
    };

    public startAnimation = () => {
        let slaves = this.slaves;
        this._socket.emit(MasterEventTypes.stopAnimation, {
            slaves,
        });
        //TODO: aan eerste slave doorgeven om animatie te starten
    };

    public stopAnimation = () => {
        let slaves = this.slaves;
        this._socket.emit(MasterEventTypes.startAnimation, {
            slaves,
        });
    };

    public changeAniamtionState(msg: { state: boolean }) {
        this.clientStorage.animating = msg.state;
    }

    public animate = (msg: {
        passingSlaves: {
            point: { x: number; y: number };
            slaveId: string;
        }[];
        currPos: { x: number; y: number };
        endPos: { x: number; y: number };
    }) => {
        let passingSlaves = msg.passingSlaves.map(Element => {
            return {
                point: new Point(Element.point.x, Element.point.x),
                slaveId: Element.slaveId,
            };
        });
        let currPos = msg.currPos;
        let endPos = msg.endPos;

        //voor initialisatie animatie
        if (endPos == null) {
            let next = this.clientStorage.triangulation.middlePoint.next();
            endPos = next.linkedMiddlePoint;
            passingSlaves = next.linkedLine;
        }
        let x = currPos.x;
        let y = currPos.y;
        let checkPoint =
            passingSlaves.length != 0 ? passingSlaves[0].point : endPos;
        //animeren over de rico van currpos to endposs
        //lines en points voor tekenen van triangulation staan in ClientStorage
        //elke frame checken of checkpoint is bereikt, zo ja breek animationloop en ga naar code hieronder

        //eindpunt is bereikt en dus een nieuwe
        if (passingSlaves.length == 0) {
            let next = this.clientStorage.triangulation.middlePoint.next();
            endPos = next.linkedMiddlePoint;
            passingSlaves = next.linkedLine;
        }
        //naar de volgende slave gaan
        let nextSlave =
            passingSlaves.length > 1
                ? passingSlaves[1].slaveId
                : passingSlaves[0].slaveId;
        //de overige slaves die nog moeten worden gepasseerd
        let newPassingslaves: {
            //TODO: interface van maken
            point: { x: number; y: number };
            slaveId: string;
        }[] = [];
        for (let index = 1; index < passingSlaves.length; index++) {
            newPassingslaves.push(passingSlaves[index]);
        }
        //moeten voor volgend deel van de animatie starten can checkpoint
        //if true, dan is de volgende slave dezelfde en moeten we geen emit sturen
        if (nextSlave == passingSlaves[0].slaveId) {
            this.animate({
                passingSlaves: newPassingslaves,
                currPos: checkPoint,
                endPos,
            });
        } else {
            this._socket.emit(MasterEventTypes.nextLine, {
                passingSlaves: newPassingslaves,
                currPos: checkPoint,
                endPos,
            });
        }
    };
}

export default Client;
