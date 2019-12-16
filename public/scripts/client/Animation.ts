import Line from "../image_processing/screen_detection/Line";
import Point from "../image_processing/screen_detection/Point";
import SlaveScreen from "../util/SlaveScreen";
import Triangulation from "../image_processing/Triangulation/Triangulation";
import { slaveFlowHandler } from "../../index";
import { MasterEventTypes } from "../types/SocketIOEvents";
import { CornerLabels } from "../types/Points";

export default class Animation {
    private line: Line;
    private point: Point;
    private slaves: SlaveScreen[];
    private slavesId: {
        slaveId: string;
        points: Point[];
        orient: string;
    }[];
    private animating: boolean = false;
    private _socket: SocketIOClient.Socket;
    private triangulation: Triangulation;

    constructor(socket: SocketIOClient.Socket, triangulation: Triangulation) {
        this._socket = socket;
        this.triangulation = triangulation;
    }

    isAnimating() {
        return this.animating;
    }

    start() {
        this.triangulation = this.triangulation;
        let points = this.triangulation.points;
        this.point = points[Math.floor(Math.random() * points.length)];
        this.nextLine();
        this.sendAnimation();
        this.animating = true;
    }

    stop() {
        this.animating = false;
    }

    nextLine() {
        let triangulation = this.triangulation;
        let lines = triangulation.copyMiddlePoints();
        const point = this.point;
        let slavesLinkedWithLine = triangulation.slaves;
        let potentialLines = lines.find(obj => obj.point.equals(point)).lines;
        this.line = //random lijn kiezen om naar toe te gaan
            potentialLines[Math.floor(Math.random() * potentialLines.length)];
        this.slavesId = slavesLinkedWithLine.find(obj =>
            obj.line.equals(this.line)
        ).slaves; //is nog een object dat de Id bevat
        //lijst met overeenkomstige slaves maken
        this.slaves = [];
        let slaves = slaveFlowHandler.screens;
        this.slavesId.forEach(slaveId => {
            this.slaves.push(
                slaves.find(function(element) {
                    return element.slaveID == slaveId.slaveId;
                })
            );
        });
    }

    sendAnimation() {
        let startTime = new Date().getTime() + 100;
        let slavesWithCurrentLine = this.slaves;
        let nextPoint = this.point;
        let slavesIdWithCurrentLine = this.slavesId;
        let reverse = false;
        if (!slavesWithCurrentLine[0].centroid.equals(nextPoint)) {
            reverse = true;
            slavesWithCurrentLine.reverse();
        }
        console.log(reverse);
        for (let i = 0; i < slavesWithCurrentLine.length; i++) {
            if (i == 0 && this.animating == true) {
                continue;
            }
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
            let nextAnimationLine: {
                string: string;
                point1: number;
                point2: number;
                duration: number;
            } = null;
            if (i == slavesWithCurrentLine.length - 1) {
                last = true;
                this.point = endPoint;
                this.nextLine();
                nextAnimationLine = this.createAnimationLine(element, reverse);
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
                next: nextAnimationLine,
            });
        }
    }

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

    createAnimationLine(slave: SlaveScreen, reverse: boolean) {
        const element = slave;
        const slaveID = element.slaveID;
        const slavesIdWithCurrentLine = this.slavesId;
        const slavesWithCurrentLine = this.slaves;
        const nextPoint = this.point;
        let animation = slavesIdWithCurrentLine.find(obj => {
            return obj.slaveId === slaveID;
        });
        let animationLine = animation.points.map(point => point.copy()); //de orientatiestring zit hier niet meer bij
        let animationOrient = animation.orient;
        if (animationLine.length == 1) {
            animationLine.unshift(null); //null gaat overeenkomen met middelpunt
            animationOrient = "n".concat(animationOrient);
        }
        //animationLine.reverse(); //hier staat de null juist
        // animationOrient = animationOrient
        //     .split("")
        //     .reverse()
        //     .join("");
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
        return {
            string: ratioAnimationLine.string,
            point1: ratioAnimationLine.point1,
            point2: ratioAnimationLine.point2,
            duration: duration,
        };
    }
}
