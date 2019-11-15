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

    private setNewSocketIOEmitters = (
        newEmitters: Array<SocketIOClient.Emitter>
    ) => {
        this._socketIOEmitters = newEmitters;
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

    public showTriangulation = () => {
        if (this.type === ConnectionType.MASTER) {
            let slaves = slaveFlowHandler.screens;
            console.log(slaves);
            let middlePoints: Point[] = [];
            //middlepoitns verplaatsen -> moet nog gebeuren
            slaves.forEach(slave => {
                middlePoints.push(slave.centroid);
            });
            for (let i = 0; i < 20; i++) {
                middlePoints.push(
                    new Point(
                        Math.floor(Math.random() * 199 + 1),
                        Math.floor(Math.random() * 199 + 1)
                    )
                );
            }
            console.log(middlePoints);
            middlePoints.sort(function(a, b) {
                if (a.x - b.x == 0) {
                    return a.y - b.y;
                } else {
                    return a.x - b.x;
                }
            });
            let triangulation = delauney(middlePoints).lines;

            console.log(middlePoints);
            console.log(triangulation);
            const canvas = createCanvas(200, 200); //nog met juiste size werken
            const ctx = canvas.getContext("2d");
            ctx.strokeStyle = "rgb(255,0,0)";
            triangulation.forEach(line => {
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
}

export default Client;
