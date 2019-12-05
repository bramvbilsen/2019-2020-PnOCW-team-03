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
import SlaveScreen from "../util/SlaveScreen";
import Triangulation from "../image_processing/Triangulation/Triangulation";
import { loadImage } from "../util/images";
import testu from "./animation";
import { lstat } from "fs";

const {
    checkIntersection,
    colinearPointWithinSegment,
} = require("line-intersect");

class Client {
    private _type: ConnectionType;
    private _slaves: Array<string> = [];
    private _socketIOEmitters: Array<SocketIOClient.Emitter> = [];
    private _socket: SocketIOClient.Socket;
    private _sync: Sync;
    private triangulation: Triangulation;
    private middle: Point;
    public onConnectionTypeChange: (connectionType: ConnectionType) => void;
    public DEBUG: boolean = false;
    public steveImg: HTMLImageElement;
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

        loadImage(`${env.baseUrl}/images/steve.png`).then(
            img => (this.steveImg = img)
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
                        ),
                        this._socket.on(
                            SlaveEventTypes.showAnimation,
                            this.showAnimation
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
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            MasterEventTypes.nextLine,
                            this.nextLine
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
        this.notifyMasterThatPictureCanBeTaken();
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
        this.notifyMasterThatPictureCanBeTaken();
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
        // Destroy the counter div
        console.log("Destroy");
        $("#countdown").replaceWith('<div id="fullScreen"></div>');

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
            var timer = setInterval(async function() {
                const now = new Date().getTime();
                const t = Math.floor(((endDate - now) % (1000 * 60)) / 1000);

                if (t > 0) {
                    $("#fullScreen").html(
                        `<div style="font-size:500px;"><center>${t}</center></div>`
                    );
                } else {
                    $("#loading").css("display", "none");
                    $("#fullScreen").html(
                        '<div style="font-size:100px;"><center>BOOOOOM !!!</center></div>'
                    );
                    // Creeper
                    const img1 = await loadImage(
                        env.baseUrl + "/images/creeper-left.png"
                    );
                    const img2 = await loadImage(
                        env.baseUrl + "/images/creeper-left2.png"
                    );
                    const imgCanvas = createCanvas(img1.width, img1.height);
                    imgCanvas.getContext("2d").drawImage(img1, 0, 0);
                    $("#fullScreen").replaceWith(
                        '<center><div id="fullScreen"><img width="400" height="550" id="fullScreenImg"></img></div><center>'
                    );
                    $("#fullScreenImg").attr("src", imgCanvas.toDataURL()); // "#image-slave"

                    let creeperSwitch = 2;
                    for (let _ = 0; _ < 6; _++) {
                        await setTimeout(function() {
                            if (creeperSwitch == 1) {
                                imgCanvas
                                    .getContext("2d")
                                    .drawImage(img2, 0, 0);
                                $("#fullScreenImg").attr(
                                    "src",
                                    imgCanvas.toDataURL()
                                );
                                creeperSwitch = 2;
                            } else {
                                imgCanvas
                                    .getContext("2d")
                                    .drawImage(img1, 0, 0);
                                $("#fullScreenImg").attr(
                                    "src",
                                    imgCanvas.toDataURL()
                                );
                                creeperSwitch = 1;
                            }
                        }, 1000);
                    }

                    clearinterval();
                    // Restore the counter div
                    setTimeout(function() {
                        console.log("Restore");
                        $("#fullScreen").replaceWith(
                            '<div id="countdown"></div>'
                        );
                    }, 10000);
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

    /**
     * Go to the next step in the current `SlaveFlowHandler`
     */
    public handleNextSlaveFlowHandlerStep = (_: any) => {
        if (slaveFlowHandler) {
            slaveFlowHandler.nextStep();
        }
    };

    public notifyMasterThatPictureCanBeTaken = () => {
        this._socket.emit(
            SlaveEventTypes.NotifyMasterThatPictureCanBeTaken,
            {}
        );
    };

    public notifyMasterThatCreeperCanStart = () => {
        this._socket.emit(SlaveEventTypes.NotifyMasterThatCreeperCanStart, {});
    };

    public calculateTriangulation = () => {
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
            let triangulation = delauney(middlePoints);

            //extra info initialiseren om tekenen/animatie mogelijk te maken
            triangulation.lines.forEach(line => {
                //voor elke lijn hetzelfde doen
                let slaveWithLine: {
                    [key: string]: Array<Point>; //string is slaveID
                } = {};
                let orientationslave: {
                    [key: string]: string; //string is slave, othet string is orientation
                } = {};
                for (let i = 0; i < slaves.length; i++) {
                    const slave = slaves[i];
                    const slaveId = slave.slaveID;
                    let orientatedPoints: {
                        [key: string]: Point; //string is which line the screen cuts
                    } = findIntersections(line, slave);
                    let points: Point[] = Object.values(orientatedPoints);
                    if (points.length > 0) {
                        slaveWithLine[slaveId] = points; //enkel toevoegen als er effectief snijpunten zijn, points zijn de snijlijnen
                        if (points.length == 1) {
                            addAngle(slave, points, orientatedPoints);
                            orientationslave[slaveId] = Object.keys(
                                orientatedPoints
                            ).find(key => orientatedPoints[key] === points[0]);
                        } else {
                            points.sort(function(a, b) {
                                //points van links naar reecht(als gelijk van boven naar onder)
                                if (a.x - b.x == 0) {
                                    return a.y - b.y;
                                } else {
                                    return a.x - b.x;
                                }
                            });
                            let fullstring = "";
                            for (let i = 0; i < points.length; i++) {
                                const element = points[i];
                                fullstring.concat(
                                    Object.keys(orientatedPoints).find(
                                        key =>
                                            orientatedPoints[key] === points[i]
                                    )
                                );
                            }
                            addLine(slave, points, orientatedPoints);
                            orientationslave[slaveId] = fullstring;
                        }
                    }
                }
                let points: Array<Point[]> = Object.values(slaveWithLine);
                //sorteren van links naar rechts
                points.sort(function(a, b) {
                    if (a[0].x - b[0].x == 0) {
                        return a[0].y - b[0].y;
                    } else {
                        return a[0].x - b[0].x;
                    }
                });
                let slaveIDs: Array<{
                    slaveId: string;
                    points: Point[];
                    orient: string;
                }> = [];
                points.forEach(points => {
                    let slave = Object.keys(slaveWithLine).find(
                        key => slaveWithLine[key] === points
                    );
                    let orient: string = orientationslave[slave];
                    slaveIDs.push({ slaveId: slave, points, orient });
                });
                triangulation.addSlaves(line, slaveIDs);
            });
            triangulation.linkMiddlePointsToLines();
            return triangulation;
        }

        function findIntersections(line: Line, slave: SlaveScreen) {
            const endPoints = line.endPoints;
            const corners = slave.sortedCorners;
            const leftUp = corners.LeftUp;
            const rightUp = corners.RightUp;
            const leftUnder = corners.LeftUnder;
            const rightUnder = corners.RightUnder;
            let cuttingPoints: {
                [key: string]: Point;
            } = {};

            let Up = checkIntersection(
                leftUp.x,
                leftUp.y,
                rightUp.x,
                rightUp.y,
                endPoints[0].x,
                endPoints[0].y,
                endPoints[1].x,
                endPoints[1].y
            );
            if (Up.type == "intersecting") {
                cuttingPoints["u"] = new Point(Up.point.x, Up.point.y);
            }
            let Right = checkIntersection(
                rightUnder.x,
                rightUnder.y,
                rightUp.x,
                rightUp.y,
                endPoints[0].x,
                endPoints[0].y,
                endPoints[1].x,
                endPoints[1].y
            );
            if (Right.type == "intersecting") {
                cuttingPoints["r"] = new Point(Right.point.x, Right.point.y);
            }
            let Left = checkIntersection(
                leftUp.x,
                leftUp.y,
                leftUnder.x,
                leftUnder.y,
                endPoints[0].x,
                endPoints[0].y,
                endPoints[1].x,
                endPoints[1].y
            );
            if (Left.type == "intersecting") {
                cuttingPoints["l"] = new Point(Left.point.x, Left.point.y);
            }
            let Under = checkIntersection(
                rightUnder.x,
                rightUnder.y,
                leftUnder.x,
                leftUnder.y,
                endPoints[0].x,
                endPoints[0].y,
                endPoints[1].x,
                endPoints[1].y
            );
            if (Under.type == "intersecting") {
                cuttingPoints["d"] = new Point(Under.point.x, Under.point.y);
            }
            return cuttingPoints;
        }

        function addAngle(
            slave: SlaveScreen,
            points: Point[],
            orientation: { [key: string]: Point }
        ) {
            let string = Object.keys(orientation).find(
                key => orientation[key] === points[0]
            );

            slave.triangulation.angles.push({ string, point: points[0] });
        }

        function addLine(
            slave: SlaveScreen,
            points: Point[],
            orientation: { [key: string]: Point }
        ) {
            let fullString = "";
            for (let i = 0; i < points.length; i++) {
                let string = Object.keys(orientation).find(
                    key => orientation[key] === points[i]
                );
                fullString = fullString.concat(string);
            }
            slave.triangulation.lines.push({
                string: fullString,
                point1: points[0],
                point2: points[1],
            });
        }
    };

    public calculateTriangulationCanvas = () => {
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
                let angles: number[] = [];

                triangulation.forEach(line => {
                    const endPoints = line.endPoints;
                    if (endPoints.includes(centroid)) {
                        let other: Point;
                        if (endPoints[0] == centroid) {
                            other = endPoints[1];
                        } else {
                            other = endPoints[0];
                        }
                        angles.push(
                            Math.atan2(
                                other.y - centroid.y,
                                other.x - centroid.x
                            )
                        );
                    }
                });
                const rotation = slave.angle;
                this._socket.emit(MasterEventTypes.SendTriangulationOnSlave, {
                    slaveId: slave.slaveID,
                    angles,
                });
            }
        }
    };

    public showTriangulation = (msg: {
        slaveId: string;
        angles: Array<number>;
    }) => {
        const canvas = createCanvas(window.innerWidth, window.innerHeight);
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "rgb(0,0,0)";
        msg.angles.forEach(angle => {
            let radius = Math.sqrt(
                Math.pow(window.innerWidth / 2, 2) +
                    Math.pow(window.innerHeight / 2, 2)
            );
            ctx.beginPath();
            ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2);
            ctx.lineTo(
                window.innerWidth / 2 + radius * Math.cos(angle),
                window.innerHeight / 2 + radius * Math.sin(angle)
            );
            ctx.stroke();
        });
        ctx.font = "50px Arial";
        ctx.fillText(
            "*",
            window.innerWidth / 2 - 10,
            window.innerHeight / 2 + 25
        );
        $("#image-slave").attr("src", canvas.toDataURL());
    };

    public showAnimationOnSlaves = () => {
        //ook eerst naar slaves juiste lijnen emitten -> nog doen
        this.triangulation = this.calculateTriangulation();
        let points = this.triangulation.points;
        this.middle = points[Math.floor(Math.random() * points.length)];
        this.nextLine(); //een beetje tijd voor er gestart wordt
    };

    public nextLine = () => {
        let nextPoint = this.middle;
        let startTime = new Date().getTime() + 5000;
        console.log("beginpunt " + nextPoint);
        let triangulation = this.triangulation;
        let lines = triangulation.copyMiddlePoints();
        let slavesLinkedWithLine = triangulation.slaves;
        let potentialLines = lines.find(obj => obj.point.equals(nextPoint))
            .lines;
        let currentLine = //random lijn kiezen om naar toe te gaan
            potentialLines[Math.floor(Math.random() * potentialLines.length)];
        let slavesIdWithCurrentLine = slavesLinkedWithLine.find(obj => {
            return obj.line === currentLine;
        }).slaves; //is nog een object dat de Id bevat
        //lijst met overeenkomstige slaves maken
        let slavesWithCurrentLine: SlaveScreen[] = [];
        let slaves = slaveFlowHandler.screens;
        slavesIdWithCurrentLine.forEach(slaveId => {
            slavesWithCurrentLine.push(
                slaves.find(function(element) {
                    return element.slaveID == slaveId.slaveId;
                })
            );
        });
        console.log(slavesWithCurrentLine);
        let reverse = false;
        if (
            !(
                slavesWithCurrentLine[0].centroid.x == nextPoint.x &&
                slavesWithCurrentLine[0].centroid.y == nextPoint.x
            )
        ) {
            reverse = true;
            slavesWithCurrentLine.reverse();
        }
        console.log(reverse);
        for (let i = 0; i < slavesWithCurrentLine.length; i++) {
            const element = slavesWithCurrentLine[i];
            const slaveID = element.slaveID;
            console.log("=====");
            console.log(slaveID);
            //dingen die moeten getekent worden
            let angles = element.triangulation.angles;
            let lines = element.triangulation.lines;
            //omvormen naar ratio
            let ratioAngles: Array<{
                string: string;
                point: number;
            }> = this.ratioAngle(element, angles);
            let ratioLines: Array<{
                string: string;
                point1: number;
                point2: number;
            }> = this.ratioLine(element, lines);
            //de animatielijn
            let animation = slavesIdWithCurrentLine.find(obj => {
                return obj.slaveId === slaveID;
            });
            let animationLine = animation.points.map(point => point.copy()); //de orientatiestring zit hier niet meer bij
            let animationOrient = animation.orient;
            if (animationLine.length == 1) {
                animationLine.unshift(null); //null gaat overeenkomen met middelpunt
                animationOrient = "n".concat(animationOrient);
            }
            if (i != 0 && reverse) {
                animationLine.reverse(); //hier staat de null juist
                animationOrient = animationOrient
                    .split("")
                    .reverse()
                    .join("");
            }
            //nu nog reversen
            console.log(animationLine);
            console.log(animationOrient);
            //animatielijn omvormen naar ratio
            let ratioAnimationLine: {
                string: string;
                point1: number;
                point2: number;
            } = this.ratioLine(element, [
                {
                    string: animationOrient,
                    point1: animationLine[0],
                    point2: animationLine[1],
                },
            ])[0];
            //snelhied
            let speed = 0.05; //pixels/ms
            //starttijd berekenen
            let startPoint: Point;
            if (animationLine[0] == null) {
                startPoint = element.centroid;
            } else {
                startPoint = animationLine[0];
            }
            console.log(nextPoint);
            console.log(startPoint);
            let start =
                startTime +
                Math.sqrt(
                    Math.pow(startPoint.x - nextPoint.x, 2) +
                        Math.pow(startPoint.y - nextPoint.y, 2) //pixels/(pixels/ms)
                ) /
                    speed;
            console.log(
                Math.sqrt(
                    Math.pow(startPoint.x - nextPoint.x, 2) +
                        Math.pow(startPoint.y - nextPoint.y, 2)
                ) / speed
            );
            //duration berekenen
            let endPoint: Point;
            if (animationLine[1] == null) {
                endPoint = element.centroid;
            } else {
                endPoint = animationLine[1];
            }
            let duration =
                Math.sqrt(
                    Math.pow(endPoint.x - startPoint.x, 2) +
                        Math.pow(endPoint.y - startPoint.y, 2)
                ) / speed;
            console.log("duration = " + duration);
            //emit voor elke slave
            //duration = 3000;
            console.log("sendig emit to " + slaveID);
            console.log(new Date(start));
            let last = false;
            if (i == slavesWithCurrentLine.length - 1) {
                last = true;
                this.middle = endPoint;
            }
            console.log(last);
            this._socket.emit(MasterEventTypes.ShowAnimationOnSlave, {
                startTime: start,
                slaveId: slaveID,
                animationLine: ratioAnimationLine,
                angles: ratioAngles,
                lines: ratioLines,
                duration: duration,
                last: last,
            });
        }
    };

    //juiste info doorsturen + nog een appart voor de animatielijn de juiste orientatie te vinden
    public ratioAngle = (
        slave: SlaveScreen,
        points: Array<{ string: string; point: Point }>
    ) => {
        let ratio: Array<{ string: string; point: number }> = [];
        const corners = slave.sortedCorners;
        points.forEach(element => {
            const string = element.string;
            let distance: number;
            let distancePoint: number; //links -> rechts, boven -> onder
            if (string == "u") {
                distance = Math.sqrt(
                    Math.pow(corners.LeftUp.x - corners.RightUp.x, 2) +
                        Math.pow(corners.LeftUp.y - corners.RightUp.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.LeftUp.x, 2) +
                        Math.pow(element.point.y - corners.LeftUp.y, 2)
                );
            } else if (string == "l") {
                distance = Math.sqrt(
                    Math.pow(corners.LeftUp.x - corners.LeftUnder.x, 2) +
                        Math.pow(corners.LeftUp.y - corners.LeftUnder.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.LeftUp.x, 2) +
                        Math.pow(element.point.y - corners.LeftUp.y, 2)
                );
            } else if (string == "r") {
                distance = Math.sqrt(
                    Math.pow(corners.RightUnder.x - corners.RightUp.x, 2) +
                        Math.pow(corners.RightUnder.y - corners.RightUp.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.RightUp.x, 2) +
                        Math.pow(element.point.y - corners.RightUp.y, 2)
                );
            } else {
                distance = Math.sqrt(
                    Math.pow(corners.RightUnder.x - corners.LeftUnder.x, 2) +
                        Math.pow(corners.RightUnder.y - corners.LeftUnder.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.LeftUnder.x, 2) +
                        Math.pow(element.point.y - corners.LeftUnder.y, 2)
                );
            }
            let ratioNumber = distancePoint / distance;
            ratio.push({ string: element.string, point: ratioNumber });
        });
        return ratio;
    };

    public ratioLine = (
        slave: SlaveScreen,
        points: Array<{ string: string; point1: Point; point2: Point }>
    ) => {
        let ratio: Array<{
            string: string;
            point1: number;
            point2: number;
        }> = [];
        const corners = slave.sortedCorners;
        points.forEach(element => {
            const fullString = element.string.split("");
            const points = [element.point1, element.point2];
            let ratioNumber: number[] = [];
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (point) {
                    const string = fullString[i];
                    let distance: number;
                    let distancePoint: number; //links -> rechts, boven -> onder
                    if (string == "u") {
                        distance = Math.sqrt(
                            Math.pow(corners.LeftUp.x - corners.RightUp.x, 2) +
                                Math.pow(
                                    corners.LeftUp.y - corners.RightUp.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.LeftUp.x, 2) +
                                Math.pow(point.y - corners.LeftUp.y, 2)
                        );
                    } else if (string == "l") {
                        distance = Math.sqrt(
                            Math.pow(
                                corners.LeftUp.x - corners.LeftUnder.x,
                                2
                            ) +
                                Math.pow(
                                    corners.LeftUp.y - corners.LeftUnder.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.LeftUp.x, 2) +
                                Math.pow(point.y - corners.LeftUp.y, 2)
                        );
                    } else if (string == "r") {
                        distance = Math.sqrt(
                            Math.pow(
                                corners.RightUnder.x - corners.RightUp.x,
                                2
                            ) +
                                Math.pow(
                                    corners.RightUnder.y - corners.RightUp.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.RightUp.x, 2) +
                                Math.pow(point.y - corners.RightUp.y, 2)
                        );
                    } else {
                        distance = Math.sqrt(
                            Math.pow(
                                corners.RightUnder.x - corners.LeftUnder.x,
                                2
                            ) +
                                Math.pow(
                                    corners.RightUnder.y - corners.LeftUnder.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.LeftUnder.x, 2) +
                                Math.pow(point.y - corners.LeftUnder.y, 2)
                        );
                    }
                    ratioNumber.push(distancePoint / distance);
                } else {
                    ratioNumber.push(null);
                }
            }
            ratio.push({
                string: element.string,
                point1: ratioNumber[0],
                point2: ratioNumber[1],
            });
        });
        return ratio;
    };

    public showAnimation = (msg: {
        startTime: number;
        slaveId: string;
        animationLine: { string: string; point1: number; point2: number };
        angles: Array<{ string: string; point: number }>;
        lines: Array<{ string: string; point1: number; point2: number }>;
        duration: number;
        last: boolean;
    }): void => {
        //$("#loading").css("display", "inherit");
        //eerst de verhoudingen omzetten naar punten -> null wordt center
        let slaveAnimationLine: Point[] = ratioToPointsLine([
            msg.animationLine,
        ])[0]; //-> volgorde is de doorloopszin
        let slaveAngles: Array<Point> = ratioToPointsAngle(msg.angles);
        let slaveLines: Array<Point[]> = ratioToPointsLine(msg.lines);
        console.log(slaveAngles);
        console.log(slaveAnimationLine);
        console.log(window.innerWidth / 2);
        console.log(window.innerHeight / 2);
        //slavaAnimation omzetten naar een aangrijpingspunt met richting en deltax
        let directionx = slaveAnimationLine[1].x - slaveAnimationLine[0].x; //pixels
        let directiony = slaveAnimationLine[1].y - slaveAnimationLine[0].y;
        let length_direction = Math.sqrt(
            Math.pow(directionx, 2) + Math.pow(directiony, 2)
        );
        directionx /= msg.duration; // pixels/40 ms
        directiony /= msg.duration;

        directionx *= 100;
        directiony *= 100;

        let last = msg.last;

        // directionx *= msg.duration / 1000;
        // directiony *= msg.duration / 1000;

        let startPoint = slaveAnimationLine[0];
        //wachten tot de animatie start
        let startTime = msg.startTime;
        startTime += this.serverTimeDiff; //syncen
        const eta_ms = startTime - Date.now();
        setTimeout(() => {
            const enddate = new Date(startTime + msg.duration);
            this.animation(
                enddate.getTime(),
                startPoint,
                directionx,
                directiony,
                slaveAngles,
                slaveLines,
                last
            );
        }, eta_ms);

        //verhoudingen naar juiste punten omzetten
        function ratioToPointsAngle(
            angles: Array<{ string: string; point: number }>
        ) {
            let points: Point[] = [];
            angles.forEach(angle => {
                let string = angle.string;
                let ratio = angle.point;
                if (string == "u") {
                    let x = ratio * window.innerWidth;
                    let y = 0;
                    points.push(new Point(x, y));
                } else if (string == "l") {
                    let x = 0;
                    let y = ratio * window.innerHeight;
                    points.push(new Point(x, y));
                } else if (string == "r") {
                    let x = window.innerWidth;
                    let y = ratio * window.innerHeight;
                    points.push(new Point(x, y));
                } else {
                    let x = ratio * window.innerWidth;
                    let y = window.innerHeight;
                    points.push(new Point(x, y));
                }
            });
            return points;
        }

        function ratioToPointsLine(
            angles: Array<{ string: string; point1: number; point2: number }>
        ) {
            let points: Array<Point[]> = [];
            angles.forEach(angle => {
                let fullstring = angle.string;
                let ratio = [angle.point1, angle.point2];
                let line: Point[] = [];
                for (let i = 0; i < ratio.length; i++) {
                    const element = ratio[i];
                    if (element) {
                        const string = fullstring[i];
                        if (string == "u") {
                            let x = element * window.innerWidth;
                            let y = 0;
                            line.push(new Point(x, y));
                        } else if (string == "l") {
                            let x = 0;
                            let y = element * window.innerHeight;
                            line.push(new Point(x, y));
                        } else if (string == "r") {
                            let x = window.innerWidth;
                            let y = element * window.innerHeight;
                            line.push(new Point(x, y));
                        } else {
                            let x = element * window.innerWidth;
                            let y = window.innerHeight;
                            line.push(new Point(x, y));
                        }
                    } else {
                        line.push(
                            new Point(
                                window.innerWidth / 2,
                                window.innerHeight / 2
                            )
                        );
                    }
                }
                points.push(line);
            });
            return points;
        }
    };

    public animation = (
        endDate: number,
        startPoint: Point,
        directionx: number, //per milliseconde
        directiony: number,
        slaveAngles: Array<Point>,
        slaveLines: Array<Point[]>,
        last: boolean
    ) => {
        let x: number = startPoint.x;
        let y: number = startPoint.y;
        var timer = setInterval(function() {
            const canvas = createCanvas(window.innerWidth, window.innerHeight);
            const ctx = canvas.getContext("2d");
            const now = new Date().getTime();
            const t = endDate - now;
            ctx.strokeStyle = "rgb(255,0,0)";
            //lijnen tekenen met middelpunten
            slaveAngles.forEach(angle => {
                ctx.beginPath();
                ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2);
                ctx.lineTo(angle.x, angle.y);
                ctx.stroke();
            });
            //anderelijnen tekenen
            slaveLines.forEach(line => {
                ctx.beginPath();
                ctx.moveTo(line[0].x, line[1].y);
                ctx.lineTo(line[1].x, line[1].y);
                ctx.stroke();
            });

            ctx.fillText(t.toString(), 20, 20);

            //ster in het midden tekenen
            ctx.font = "50px Arial";
            ctx.fillText(
                "*",
                window.innerWidth / 2 - 10,
                window.innerHeight / 2 + 25
            );
            if (t > 0) {
                //circel tekenen
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, 2 * Math.PI);
                ctx.stroke();
                //ctx.drawImage(self.steveImg, x, y, 50, 50);
                x += directionx;
                y += directiony;
                $("#image-slave").attr("src", canvas.toDataURL());
            } else {
                $("#image-slave").attr("src", canvas.toDataURL());
                clearinterval();
            }
        }, 100);
        const clearinterval = () => {
            console.log("last= " + last);
            console.log("hey");
            clearInterval(timer);
            console.log("emit");
            if (last) {
                this._socket.emit(SlaveEventTypes.animationFinished, {});
            }
        };
    };
}

export default Client;
