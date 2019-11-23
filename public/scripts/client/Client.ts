import { ConnectionType } from "../types/ConnectionType";
import {
    SharedEventTypes,
    SlaveEventTypes,
    MasterEventTypes,
} from "../types/SocketIOEvents";
import { generateRandomColor } from "../util/colors";
import { IRGBAColor } from "../types/Color";
import env from "../../env/env";
import Sync from "../util/Sync";
import delauney from "../image_processing/Triangulation/Delaunay";
import { slaveFlowHandler } from "../../index";
import Point from "../image_processing/screen_detection/Point";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import Line from "../image_processing/screen_detection/Line";
import { uploadSlaveImgCanvas } from "../util/image_uploader";
import { BoundingBox } from "../util/BoundingBox";
import { flattenOneLevel } from "../util/arrays";

class Client {
    private _type: ConnectionType;
    private _slaves: Array<string> = [];
    private _socketIOEmitters: Array<SocketIOClient.Emitter> = [];
    private _socket: SocketIOClient.Socket;
    private _sync: Sync;
    public onConnectionTypeChange: (connectionType: ConnectionType) => void;
    public DEBUG: boolean = false;
    /**
     * Color that the user wants to display on the slave.
     * Only applicable for masters.
     */
    public color: IRGBAColor = {
        r: 255,
        g: 70,
        b: 181,
        a: 100,
    };

    constructor(args: {
        onConnectionTypeChange: (connectionType: ConnectionType) => void;
    }) {
        this.onConnectionTypeChange = args.onConnectionTypeChange;
        this._socket = io.connect(env.baseUrl);
        this._socket.on("connected", () => console.log("Connected!"));

        this._sync = new Sync(this._socket);

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
                        this._socket.on(
                            SlaveEventTypes.DisplayArrowUp,
                            this.displayArrowUp
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayArrowRight,
                            this.displayArrowRight
                        ),
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
                            SlaveEventTypes.DisplayTriangulationOnSlave,
                            this.showTriangulation
                        )
                    );
                } else {
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            MasterEventTypes.SlaveChanges,
                            this.handleSlaveChanges
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
     * Sends a request to the server to change the background colors of the slaves.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showColorsOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        let slaveColorCoding: { [slaveID: string]: string } = {};
        this.slaves.forEach(slaveID => {
            slaveColorCoding[slaveID] = generateRandomColor();
        });
        this._socket.emit(
            MasterEventTypes.ChangeSlaveBackgrounds,
            slaveColorCoding
        );
        return slaveColorCoding;
    };

    /**
     * Sends a request to the server to change the background color of the slave.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showColorOnSlave = (slaveId: string) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        const { a, ...color } = this.color;
        this._socket.emit(MasterEventTypes.ChangeSlaveBackground, {
            slaveId,
            color,
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
            leftTop: { r: 0, g: 0, b: 0 },
            rightTop: { r: 0, g: 0, b: 0 },
            leftBottom: { r: 0, g: 0, b: 0 },
            rightBottom: { r: 0, g: 0, b: 0 },
        });
    };

    /**
     * Sends a request commanding all slaves to display an arrow pointing upwards.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showArrowsUpOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO DISPLAY ARROWS.\nNot executing command!"
            );
            return;
        }
        this._socket.emit(MasterEventTypes.SendArrowsUp);
    };

    /**
     * Sends a request commanding all slaves to display an arrow pointing to the right.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showArrowsRightOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO DISPLAY ARROWS.\nNot executing command!"
            );
            return;
        }
        this._socket.emit(MasterEventTypes.SendArrowsRight);
    };

    /**
     * Uploads an image (canvas) to the server and sends a Socket io event to the client
     * to display the uploaded image.
     */
    public showCanvasImgOnSlave = (
        slaveId: string,
        canvas: HTMLCanvasElement
    ) => {
        // Create test canvas for test purposes
        if (!canvas) {
            canvas = createCanvas(1280, 720);
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "rgb(0, 0, 0)";
            ctx.fillRect(0, 0, 1280, 720);
            ctx.fillStyle = "rgb(255, 0, 0)";
            ctx.fillRect(50, 50, 300, 300);
        }
        uploadSlaveImgCanvas(slaveId, canvas).then(({ imgPath }) => {
            console.log(imgPath);
            this._socket.emit(MasterEventTypes.DisplayImageOnSlave, {
                imgUrl: `${env.baseUrl}${imgPath}`,
                slaveId,
            });
        });
    };

    /**
     * Passes master to the slave that connected after the master or to the slave with `slaveId` if provided.
     * @argument slaveId
     */
    public giveUpMaster(slaveId?: string) {
        this._socket.emit(MasterEventTypes.GiveUpMaster, { slaveId });
    }

    private setNewSocketIOEmitters = (
        newEmitters: Array<SocketIOClient.Emitter>
    ) => {
        this._socketIOEmitters = newEmitters;
    };

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

    private changeBackground = (data: {
        color: { r: number; g: number; b: number };
    }): void => {
        const page: JQuery<HTMLBodyElement> = $("#page");
        page.css(
            "background-color",
            `rgb(${data.color.r}, ${data.color.g}, ${data.color.b})`
        );
    };

    private toggleOrientationColors = (data: {
        leftTop: { r: string; g: string; b: string };
        rightTop: { r: string; g: string; b: string };
        leftBottom: { r: string; g: string; b: string };
        rightBottom: { r: string; g: string; b: string };
    }): void => {
        console.log("Toggling");
        const orientationElem: JQuery<HTMLDivElement> = $(
            "#orientation-colors"
        );
        if (orientationElem.attr("display") !== "none") {
            this.changeBackground({ color: { r: 76, g: 175, b: 80 } });
        }
        orientationElem.toggle();
    };

    private displayArrowUp = (): void => {
        //$('#arrowImg').remove('<img id="arrowRight" src="../img/arrowRight.png" />');
        $("#arrowImg").replaceWith(
            '<img id="arrowUp" src="../img/arrowUp.png" />'
        );
    };

    private displayArrowRight = (): void => {
        $("#arrowImg").replaceWith(
            '<img id="arrowRight" src="../img/arrowRight.png" />'
        );
    };

    private displayImage = (data: { imgUrl: string }): void => {
        console.log("DISPLAYING IMAGE: " + data.imgUrl);
        $("#main-flow-slave").hide();
        $("#image-slave").attr("src", data.imgUrl + "?" + Math.random());
    };

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

    private startCounterEvent = (msg: { startTime: number }): void => {
        $("#loading").css("display", "inherit");
        let { startTime } = msg;
        startTime += this.serverTimeDiff;
        const eta_ms = startTime - Date.now();
        setTimeout(function() {
            const elevenseconds = 11000;
            const enddate = new Date(startTime + elevenseconds);
            countdown(enddate.getTime());
        }, eta_ms);

        function countdown(endDate: number) {
            var timer = setInterval(function() {
                const now = new Date().getTime();
                const t = Math.floor(((endDate - now) % (1000 * 60)) / 1000);

                if (t > 0) {
                    $("#countdown").html(`<h2>${t}</h2>`);
                } else {
                    $("#loading").css("display", "none");
                    $("#countdown").html("<h1>BOOOOOMMM</h1>");
                    clearinterval();
                }
            }, 1);
            function clearinterval() {
                clearInterval(timer);
            }
        }
    };

    private handleSlaveChanges = (data: { slaves: Array<string> }) => {
        this._slaves = data.slaves;
        $("#welcome-master-connected-slaves-amt").text(data.slaves.length);
    };

    public calculateTriangulation = () => {
        if (this.type === ConnectionType.MASTER) {
            let slaves = slaveFlowHandler.screens;
            let middlePoints: Point[] = [];
            const globalBoundingBox = new BoundingBox(
                flattenOneLevel(
                    slaveFlowHandler.screens.map(screen => screen.corners)
                )
            );
            const leftCorner = globalBoundingBox.topLeft;
            slaves.forEach(slave => {
                let centroid = slave.centroid;
                centroid.x -= leftCorner.x;
                centroid.y -= leftCorner.y;
                middlePoints.push(centroid);
            });
            console.log(middlePoints);
            middlePoints.sort(function(a, b) {
                if (a.x - b.x == 0) {
                    return a.y - b.y;
                } else {
                    return a.x - b.x;
                }
            });
            let triangulation = delauney(middlePoints).lines;
            const canvas = createCanvas(
                globalBoundingBox.width,
                globalBoundingBox.height
            );
            const ctx = canvas.getContext("2d");
            ctx.strokeStyle = "rgb(0,0,0)";
            triangulation.forEach((line: Line) => {
                let endPoints = line.endPoints;
                ctx.beginPath();
                ctx.moveTo(endPoints[0].x, endPoints[0].y);
                ctx.lineTo(endPoints[1].x, endPoints[1].y);
                ctx.stroke();
            });
            middlePoints.forEach(point => {
                ctx.font = "50px Arial";
                ctx.fillText("*", point.x - 10, point.y + 25);
            });
            $("#result-img").attr("src", canvas.toDataURL());
            return canvas;
        }
    };

    public sendTriangulationOnSlave = () => {
        if (this.type === ConnectionType.MASTER) {
            let slaves = slaveFlowHandler.screens;
            let middlePoints: Point[] = [];
            slaves.forEach(slave => {
                let centroid = slave.centroid;
                middlePoints.push(centroid);
            });
            middlePoints.sort(function(a, b) {
                if (a.x - b.x == 0) {
                    return a.y - b.y;
                } else {
                    return a.x - b.x;
                }
            });
            let triangulation = delauney(middlePoints).lines;
            for (let i = 0; i < slaves.length; i++) {
                const slave = slaves[i];
                const centroid = middlePoints[i];
                let lines: Line[] = [];
                const leftUp = slave.sortedCorners.LeftUp;

                triangulation.forEach(line => {
                    if (line.endPoints.includes(centroid)) {
                        lines.push(line);
                    }
                });
                const rotation = slave.widthEdge.angleBetweenEndpoints;
                this._socket.emit(MasterEventTypes.SendTriangulationOnSlave, {
                    slaveId: slave.slaveID,
                    centroid: {
                        x: centroid.x - leftUp.x,
                        y: centroid.y - leftUp.y,
                    },
                    lines: lines.map(line => {
                        return {
                            x0: line.endPoints[0].x - leftUp.x,
                            y0: line.endPoints[0].y - leftUp.y,
                            x1: line.endPoints[1].x - leftUp.x,
                            y1: line.endPoints[1].y - leftUp.y,
                        };
                    }),
                });
            }
        }
    };
    public showTriangulation = (msg: {
        slaveId: string;
        centroid: { x: number; y: number };
        lines: Array<{ x0: number; y0: number; x1: number; y1: number }>;
    }) => {
        const canvas = createCanvas(window.innerWidth, window.innerHeight);
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "rgb(0,0,0)";
        msg.lines.forEach(
            (line: { x0: number; y0: number; x1: number; y1: number }) => {
                ctx.beginPath();
                ctx.moveTo(line.x0, line.y0);
                ctx.lineTo(line.x1, line.y1);
                ctx.stroke();
            }
        );
        ctx.font = "50px Arial";
        ctx.fillText("*", msg.centroid.x - 10, msg.centroid.y + 25);
        $("#result-img").attr("src", canvas.toDataURL());
    };
}

export default Client;
