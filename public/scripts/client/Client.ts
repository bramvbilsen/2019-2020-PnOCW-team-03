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
import { slaveFlowHandler } from "../../index";
import Point from "../image_processing/screen_detection/Point";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import Line from "../image_processing/screen_detection/Line";
import { BoundingBox } from "../util/BoundingBox";
import { flattenOneLevel } from "../util/arrays";
import SlaveScreen from "../util/SlaveScreen";
import Triangulation from "../image_processing/Triangulation/Triangulation";
import { loadImage } from "../util/images";
import Animation from "./Animation";
import { wait } from "../image_processing/SlaveFlowHandler";
import { CornerLabels } from "../types/Points";
import { colortest } from "../../tests/color_detection/colorTesting";
import p5 from "p5";
import ClientStorage from "./ClientStorage";

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
    private circleAnimation: Animation;
    private triangulation: Triangulation;
    private middle: Point;
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
                            SlaveEventTypes.DisplayTriangulationOnSlave,
                            this.showTriangulation
                        ),
                        this._socket.on(
                            SlaveEventTypes.showAnimation,
                            this.showAnimation
                        ),
                        this._socket.on(
                            SlaveEventTypes.linesShow,
                            this.linesShow
                        ),
                        this._socket.on(
                            SlaveEventTypes.receiveCutData,
                            this.receiveCutData
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
                            this.nextlinesend
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

    /**    ____________________________________________
     *   /                                              \
     *  | Beginning of triangulation and animation code. |
     *   \ ____________________________________________ /
     */

    /**
     * The code below is duplicated in Animation.ts
     * Fixme Client.ts should incorporate the methods from Animation.ts
     */

    /**
     * Calculates the triangulation of the screens.
     */
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
                                fullstring = fullstring.concat(
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
                    let aa: Point;
                    let bb: Point;
                    if ((a.length = 1)) {
                        aa = slaves.find(
                            element =>
                                element.slaveID ===
                                Object.keys(slaveWithLine).find(
                                    key => slaveWithLine[key] === a
                                )
                        ).centroid;
                    } else {
                        aa = a[0];
                    }
                    if ((b.length = 1)) {
                        bb = slaves.find(
                            element =>
                                element.slaveID ===
                                Object.keys(slaveWithLine).find(
                                    key => slaveWithLine[key] === b
                                )
                        ).centroid;
                    } else {
                        bb = b[0];
                    }

                    if (aa.x - bb.x == 0) {
                        return aa.y - bb.y;
                    } else {
                        return aa.x - bb.x;
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
            console.log(triangulation);
            console.log(slaves);
            return triangulation;
        }

        function findIntersections(line: Line, slave: SlaveScreen) {
            const endPoints = line.endPoints;
            const corners = slave.sortedCorners;
            const leftUp = stringToPoint(
                slave.mapActualToMasterCornerLabel(CornerLabels.LeftUp),
                slave
            );
            const rightUp = stringToPoint(
                slave.mapActualToMasterCornerLabel(CornerLabels.RightUp),
                slave
            );
            const leftUnder = stringToPoint(
                slave.mapActualToMasterCornerLabel(CornerLabels.LeftUnder),
                slave
            );
            const rightUnder = stringToPoint(
                slave.mapActualToMasterCornerLabel(CornerLabels.RightUnder),
                slave
            );
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

        function stringToPoint(corner: CornerLabels, slave: SlaveScreen) {
            if (corner == CornerLabels.LeftUp) {
                return slave.sortedCorners.LeftUp;
            }

            if (corner == CornerLabels.LeftUnder) {
                return slave.sortedCorners.LeftUnder;
            }

            if (corner == CornerLabels.RightUp) {
                return slave.sortedCorners.RightUp;
            }

            if (corner == CornerLabels.RightUnder) {
                return slave.sortedCorners.RightUnder;
            }
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
        this.hideAllSlaveLayers();
        this.moveToForeground("image-container-slave");
    };

    public showAnimationOnSlaves = () => {
        //ook eerst naar slaves juiste lijnen emitten -> nog doen
        this.triangulation = this.calculateTriangulation();
        let points = this.triangulation.points;
        this.middle = points[Math.floor(Math.random() * points.length)];
        this.nextLine();
    };

    public nextLine = () => {
        let nextPoint = this.middle;
        let startTime = new Date().getTime() + 100;
        console.log("beginpunt " + nextPoint);
        let triangulation = this.triangulation;
        let lines = triangulation.copyMiddlePoints();
        let slavesLinkedWithLine = triangulation.slaves;
        let potentialLines = lines.find(obj => obj.point.equals(nextPoint))
            .lines;
        let currentLine = //random lijn kiezen om naar toe te gaan
            potentialLines[Math.floor(Math.random() * potentialLines.length)];
        let slavesIdWithCurrentLine = slavesLinkedWithLine.find(obj =>
            obj.line.equals(currentLine)
        ).slaves; //is nog een object dat de Id bevat
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
        if (!slavesWithCurrentLine[0].centroid.equals(nextPoint)) {
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
            if (i == slavesWithCurrentLine.length - 1) {
                animationLine.reverse(); //hier staat de null juist
                animationOrient = animationOrient
                    .split("")
                    .reverse()
                    .join("");
            }
            if (i != 0 && reverse && i != slavesWithCurrentLine.length - 1) {
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
            let speed = 0.01; //pixels/ms
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
            console.log(startPoint);
            console.log(endPoint);
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
        //const corners = slave.sortedCorners;
        const LeftUp = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.LeftUp),
            slave
        );
        const RightUp = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.RightUp),
            slave
        );
        const LeftUnder = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.LeftUnder),
            slave
        );
        const RightUnder = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.RightUnder),
            slave
        );
        points.forEach(element => {
            const string = element.string;
            let distance: number;
            let distancePoint: number; //links -> rechts, boven -> onder
            if (string == "u") {
                distance = Math.sqrt(
                    Math.pow(LeftUp.x - RightUp.x, 2) +
                        Math.pow(LeftUp.y - RightUp.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - LeftUp.x, 2) +
                        Math.pow(element.point.y - LeftUp.y, 2)
                );
            } else if (string == "l") {
                distance = Math.sqrt(
                    Math.pow(LeftUp.x - LeftUnder.x, 2) +
                        Math.pow(LeftUp.y - LeftUnder.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - LeftUp.x, 2) +
                        Math.pow(element.point.y - LeftUp.y, 2)
                );
            } else if (string == "r") {
                distance = Math.sqrt(
                    Math.pow(RightUnder.x - RightUp.x, 2) +
                        Math.pow(RightUnder.y - RightUp.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - RightUp.x, 2) +
                        Math.pow(element.point.y - RightUp.y, 2)
                );
            } else {
                distance = Math.sqrt(
                    Math.pow(RightUnder.x - LeftUnder.x, 2) +
                        Math.pow(RightUnder.y - LeftUnder.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - LeftUnder.x, 2) +
                        Math.pow(element.point.y - LeftUnder.y, 2)
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
        //const corners = slave.sortedCorners;
        const leftUp = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.LeftUp),
            slave
        );
        const rightUp = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.RightUp),
            slave
        );
        const leftUnder = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.LeftUnder),
            slave
        );
        const rightUnder = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.RightUnder),
            slave
        );
        points.forEach(element => {
            const fullString = element.string.split("");
            const points_ = [element.point1, element.point2];
            console.log("de lijn " + points_);
            let ratioNumber: number[] = [];
            for (let i = 0; i < points_.length; i++) {
                const point = points_[i];
                if (point) {
                    const string = fullString[i];
                    let distance: number;
                    let distancePoint: number; //links -> rechts, boven -> onder
                    if (string == "u") {
                        distance = Math.sqrt(
                            Math.pow(leftUp.x - rightUp.x, 2) +
                                Math.pow(leftUp.y - rightUp.y, 2)
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - leftUp.x, 2) +
                                Math.pow(point.y - leftUp.y, 2)
                        );
                    } else if (string == "l") {
                        distance = Math.sqrt(
                            Math.pow(leftUp.x - leftUnder.x, 2) +
                                Math.pow(leftUp.y - leftUnder.y, 2)
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - leftUp.x, 2) +
                                Math.pow(point.y - leftUp.y, 2)
                        );
                    } else if (string == "r") {
                        distance = Math.sqrt(
                            Math.pow(rightUnder.x - rightUp.x, 2) +
                                Math.pow(rightUnder.y - rightUp.y, 2)
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - rightUp.x, 2) +
                                Math.pow(point.y - rightUp.y, 2)
                        );
                    } else {
                        distance = Math.sqrt(
                            Math.pow(rightUnder.x - leftUnder.x, 2) +
                                Math.pow(rightUnder.y - leftUnder.y, 2)
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - leftUnder.x, 2) +
                                Math.pow(point.y - leftUnder.y, 2)
                        );
                    }
                    ratioNumber.push(distancePoint / distance);
                } else {
                    ratioNumber.push(null);
                }
            }
            console.log("de ratio " + ratioNumber);
            ratio.push({
                string: element.string,
                point1: ratioNumber[0],
                point2: ratioNumber[1],
            });
        });
        return ratio;
    };

    public stringToPoint = (corner: CornerLabels, slave: SlaveScreen) => {
        if (corner == CornerLabels.LeftUp) {
            return slave.sortedCorners.LeftUp;
        }

        if (corner == CornerLabels.LeftUnder) {
            return slave.sortedCorners.LeftUnder;
        }

        if (corner == CornerLabels.RightUp) {
            return slave.sortedCorners.RightUp;
        }

        if (corner == CornerLabels.RightUnder) {
            return slave.sortedCorners.RightUnder;
        }
    };

    public showAnimation = (msg: {
        startTime: number;
        slaveId: string;
        animationLine: { string: string; point1: number; point2: number };
        angles: Array<{ string: string; point: number }>;
        lines: Array<{ string: string; point1: number; point2: number }>;
        duration: number;
        last: boolean;
        next: {
            string: string;
            point1: number;
            point2: number;
            duration: number;
        };
    }): void => {
        let nextDuration: number = null;
        let nextLine: Point[] = null;
        let directionxNext: number;
        let directionyNext: number;
        if (msg.next) {
            nextDuration = msg.next.duration;
            nextLine = ratioToPointsLine([
                {
                    string: msg.next.string,
                    point1: msg.next.point1,
                    point2: msg.next.point2,
                },
            ])[0];
            directionxNext = nextLine[1].x - nextLine[0].x; //pixels
            directionyNext = nextLine[1].y - nextLine[0].y;
            directionxNext /= msg.duration; // pixels/40 ms
            directionyNext /= msg.duration;

            directionxNext *= 80;
            directionyNext *= 80;
        }
        console.log("last = " + msg.last);
        console.log("next = " + nextLine + "dd " + nextDuration);
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

        directionx *= 80;
        directiony *= 80;

        let last = msg.last;

        // directionx *= msg.duration / 1000;
        // directiony *= msg.duration / 1000;

        let startPoint = slaveAnimationLine[0];
        //wachten tot de animatie start
        let startTime = msg.startTime;
        startTime += this.serverTimeDiff; //syncen
        const eta_ms = startTime - Date.now();
        console.log("start= " + new Date(startTime));
        console.log("duration= " + msg.duration);
        setTimeout(() => {
            const enddate = new Date(startTime + msg.duration);
            //new p5(this.p5Animation);
            this.animation(
                enddate.getTime(),
                startPoint,
                directionx,
                directiony,
                slaveAngles,
                slaveLines,
                last,
                nextDuration,
                directionxNext,
                directionyNext
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
                console.log("lijn = " + angle);
                let fullstring = angle.string;
                let ratio = [angle.point1, angle.point2];
                console.log("ration =" + ratio);
                let line: Point[] = [];
                for (let i = 0; i < ratio.length; i++) {
                    const element = ratio[i];
                    console.log("element = " + element);
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
                console.log(line);
            });
            return points;
        }
    };

    /**
     * Animation code
     * Direct all questions to Maarten Pyck.
     */
    public animation = (
        endDate: number,
        startPoint: Point,
        directionx: number, //per milliseconde
        directiony: number,
        slaveAngles: Array<Point>,
        slaveLines: Array<Point[]>,
        last: boolean,
        nextDuration: number,
        directionxNext: number,
        directionyNext: number
    ) => {
        window.scrollTo(0, window.innerHeight);
        console.log("eindtijd = " + new Date(endDate));
        console.log("dx =" + directionx);
        console.log("dy =" + directiony);
        let x: number = startPoint.x;
        let y: number = startPoint.y;

        const animationSketch = (p: p5) => {
            //Hier in het drawen. Check hier Adam

            p.setup = function() {
                const fps = 30; // TODO: pas aan
                p.frameRate(fps);
                const p5Canvas = p.createCanvas(
                    window.innerWidth,
                    window.innerHeight
                );
                p5Canvas.id("animation");
                const ctx = 0; //drawingContext;
                const now = new Date().getTime();
                const t = endDate - now;
            };

            p.draw = () => {
                p.clear();
                const now = new Date().getTime();
                const t = endDate - now;
                slaveAngles.forEach(angle => {
                    drawLineA(angle);
                });
                slaveLines.forEach(line => {
                    drawLineL(line);
                });
                drawCentres();

                let notOutOfBound = true;
                if (
                    x < 0 ||
                    x > window.innerWidth ||
                    y < 0 ||
                    y > window.innerHeight
                ) {
                    notOutOfBound = false;
                }
                if (last) {
                    //voor last moet je niet kijken naar outofbound
                    notOutOfBound = false;
                }
                if (t > 0 || notOutOfBound) {
                    //circel tekenen
                    drawBall();
                    x += directionx;
                    y += directiony;
                    $("#image-slave").attr("src", canvas.toDataURL());
                } else {
                    if (last) {
                        drawBall();
                    }
                    $("#image-slave").attr("src", canvas.toDataURL());
                    clearinterval();
                }
            };

            /**
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

            };*/

            function drawBall() {
                p.stroke(0, 0, 0, 0);
                p.fill("red");
                p.circle(x, y, 30);
            }

            function drawLineA(angle: Point) {
                p.fill(0, 0, 255, 0);
                p.stroke("blue");
                p.line(
                    window.innerWidth / 2,
                    window.innerHeight / 2,
                    angle.x,
                    angle.y
                );
            }
            function drawLineL(line: Point[]) {
                p.fill(0, 0, 255, 0);
                p.stroke("blue");
                p.line(line[0].x, line[0].y, line[1].x, line[1].y);
            }
            function drawCentres() {
                p.textSize(50);
                p.textFont("Arial");
                p.fill(0); //black
                p.text(
                    "*",
                    window.innerHeight / 2 - 10,
                    window.innerHeight / 2 + 25
                );
            }
        };

        var timer = setInterval(function() {
            const canvas = createCanvas(window.innerWidth, window.innerHeight);

            new p5(animationSketch);

            const ctx = canvas.getContext("2d");
            const now = new Date().getTime();
            const t = endDate - now;
            ctx.strokeStyle = "rgb(0,0,255)";
            ctx.fillStyle = "rgb(0,0,255)";
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
                ctx.moveTo(line[0].x, line[0].y);
                ctx.lineTo(line[1].x, line[1].y);
                ctx.stroke();
            });

            //TODO Is dit nodig? is timer right? #Maarten#bram
            ctx.fillText(t.toString(), 20, 20);

            //ster in het midden tekenen
            ctx.font = "50px Arial";
            ctx.fillText(
                "*",
                window.innerWidth / 2 - 10,
                window.innerHeight / 2 + 25
            );
            let notOutOfBound = true;
            if (
                x < 0 ||
                x > window.innerWidth ||
                y < 0 ||
                y > window.innerHeight
            ) {
                notOutOfBound = false;
            }
            if (last) {
                //voor last moet je niet kijken naar outofbound
                notOutOfBound = false;
            }
            if (t > 0 || notOutOfBound) {
                //circel tekenen
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill();
                //ctx.drawImage(self.steveImg, x, y, 50, 50);
                x += directionx;
                y += directiony;
                $("#image-slave").attr("src", canvas.toDataURL());
            } else {
                if (last) {
                    ctx.beginPath();
                    ctx.arc(x, y, 30, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill();
                }
                $("#image-slave").attr("src", canvas.toDataURL());
                clearinterval();
            }
        }, 80);
        const clearinterval = () => {
            console.log("last= " + last);
            console.log("hey");
            clearInterval(timer);
            console.log("emit");
            if (last) {
                this._socket.emit(SlaveEventTypes.animationFinished, {});
                x = window.innerWidth / 2;
                y = window.innerHeight / 2;
                endDate += nextDuration;
                var timer2 = setInterval(function() {
                    const canvas = createCanvas(
                        window.innerWidth,
                        window.innerHeight
                    );
                    const ctx = canvas.getContext("2d");
                    const now = new Date().getTime();
                    const t = endDate - now;
                    ctx.strokeStyle = "rgb(0,0,255)";
                    ctx.fillStyle = "rgb(0,0,255)";
                    //lijnen tekenen met middelpunten
                    slaveAngles.forEach(angle => {
                        ctx.beginPath();
                        ctx.moveTo(
                            window.innerWidth / 2,
                            window.innerHeight / 2
                        );
                        ctx.lineTo(angle.x, angle.y);
                        ctx.stroke();
                    });
                    //anderelijnen tekenen
                    slaveLines.forEach(line => {
                        ctx.beginPath();
                        ctx.moveTo(line[0].x, line[0].y);
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
                    let notOutOfBound = true;
                    if (
                        x < 0 ||
                        x > window.innerWidth ||
                        y < 0 ||
                        y > window.innerHeight
                    ) {
                        notOutOfBound = false;
                    }
                    if (t > 0 || notOutOfBound) {
                        //cirkel tekenen
                        ctx.beginPath();
                        ctx.arc(x, y, 30, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.fill();
                        //ctx.drawImage(self.steveImg, x, y, 50, 50);
                        x += directionxNext;
                        y += directionyNext;
                        $("#image-slave").attr("src", canvas.toDataURL());
                    } else {
                        $("#image-slave").attr("src", canvas.toDataURL());
                        clearInterval(timer2);
                    }
                }, 80);
            }
        };
    };

    /**
     * Start animation code
     */
    public startAnimation() {
        this.triangulation = this.calculateTriangulation();
        this.hideAllSlaveLayers();
        this.moveToForeground("image-container-slave");
        this.triangulationShow();
        wait(1000).then(() => {
            this.circleAnimation = new Animation(
                this._socket,
                this.triangulation
            );
            this.circleAnimation.start();
        });
    }

    /**
     * Stop animation code
     */
    public stopAnimation() {
        if (this.circleAnimation) {
            this.circleAnimation.stop();
            this.hideAllSlaveLayers();
            console.log("stopping animation");
            this.moveToForeground("default-slave-state");
        }
    }

    /**
     * Send nex animation code
     */
    public nextlinesend = () => {
        if (this.circleAnimation.isAnimating()) {
            this.circleAnimation.sendAnimation();
        }
    };

    /**
     * Show triangulation code
     */
    public triangulationShow = () => {
        let slaves = slaveFlowHandler.screens;
        this.triangulation = this.calculateTriangulation();

        slaves.forEach(element => {
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
            let slaveId = element.slaveID;
            this._socket.emit(MasterEventTypes.triangulationShow, {
                slaveId: slaveId,
                angles: ratioAngles,
                lines: ratioLines,
            });
        });
    };

    /**
     * Show next line code
     */
    public linesShow = (msg: {
        slaveId: string;
        angles: Array<{ string: string; point: number }>;
        lines: Array<{ string: string; point1: number; point2: number }>;
    }) => {
        let slaveAngles: Array<Point> = ratioToPointsAngle(msg.angles);
        let slaveLines: Array<Point[]> = ratioToPointsLine(msg.lines);

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
                console.log("lijn = " + angle);
                let fullstring = angle.string;
                let ratio = [angle.point1, angle.point2];
                console.log("ration =" + ratio);
                let line: Point[] = [];
                for (let i = 0; i < ratio.length; i++) {
                    const element = ratio[i];
                    console.log("element = " + element);
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
                console.log(line);
            });
            return points;
        }

        const canvas = createCanvas(window.innerWidth, window.innerHeight);
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "rgb(0,0,255)";
        ctx.fillStyle = "rgb(0,0,255)";
        //lijnen tekenen met middelpunten
        slaveAngles.forEach(angle => {
            ctx.beginPath();
            ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2);
            ctx.lineTo(angle.x, angle.y);
            ctx.stroke();
        });
        //andere lijnen tekenen
        slaveLines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line[0].x, line[0].y);
            ctx.lineTo(line[1].x, line[1].y);
            ctx.stroke();
        });

        //ster in het midden tekenen
        ctx.font = "50px Arial";
        ctx.fillText(
            "*",
            window.innerWidth / 2 - 10,
            window.innerHeight / 2 + 25
        );

        $("#image-slave").attr("src", canvas.toDataURL());
    };

    public colortest = () => colortest(0, 0, 255, 240, 100, 50);

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
}

export default Client;
