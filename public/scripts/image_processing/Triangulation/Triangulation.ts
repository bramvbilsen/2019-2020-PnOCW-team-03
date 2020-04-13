import Point from "../screen_detection/Point";
import Line from "../screen_detection/Line";
import SlaveScreen from "../../util/SlaveScreen";
import { CornerLabels } from "../../types/Points";

const {
    checkIntersection,
    colinearPointWithinSegment,
} = require("line-intersect");

export default class Triangulation {
    line: Line[];
    //USELESS
    // slaves: Array<{
    //     line: Line;
    //     slaves: Array<{ slaveId: string; points: Point[]; orient: string }>;
    // }> = [];
    // middlePoints: Array<{ point: Point; lines: Array<Line> }> = [];

    constructor(line: Line[]) {
        this.line = line;
    }

    get lines() {
        return this.line;
    }

    get points() {
        let points: Point[] = [];
        let lines: Line[] = this.lines;
        for (let i = 0; i < lines.length; i++) {
            if (points.indexOf(lines[i].endPoints[0]) == -1) {
                points.push(lines[i].endPoints[0]);
            }
            if (points.indexOf(lines[i].endPoints[1]) == -1) {
                points.push(lines[i].endPoints[1]);
            }
        }
        return points;
    }

    // add(line: Line) {
    //     this.lines.concat(line);
    // }

    // copyLines() {
    //     return this.lines.map(line => line.copy());
    // }

    // copyMiddlePoints() {
    //     return this.middlePoints.map(middlePoint => ({
    //         point: middlePoint.point.copy(),
    //         lines: middlePoint.lines.map(line => line.copy()),
    //     }));
    // }

    linesWithCertainPoints(point: Point) {
        let found: Line[] = [];
        let lines: Line[] = this.lines;
        for (let i = 0; i < lines.length; i++) {
            if (
                lines[i].endPoints.includes(point) &&
                lines[i].endPoints[0] != lines[i].endPoints[1]
            ) {
                found.push(lines[i]);
            }
        }
        return found;
    }

    remove(line: Line) {
        this.lines.splice(this.lines.indexOf(line), 1);
    }

    //TODO: functie opsplitsen
    sendData(slave: SlaveScreen, allSlaves: SlaveScreen[], tL: Point) {
        const sendLines = this.lines.map((element) => {
            return {
                x1: element.a.x,
                y1: element.a.y,
                x2: element.b.x,
                y2: element.b.y,
            };
        });
        const points = this.points.map(function (element) {
            return { x: element.x, y: element.y };
        });
        let centroid = slave.centroid.copyTranslated(-tL.x, -tL.y);
        let linkedLines: Line[] = [];
        let linkedPoints: Point[] = [];
        this.lines.forEach((line) => {
            if (line.endPoints[0].equals(centroid)) {
                linkedLines.push(line);
                linkedPoints.push(line.endPoints[1]);
            }
            if (line.endPoints[1].equals(centroid)) {
                linkedLines.push(line);
                linkedPoints.push(line.endPoints[0]);
            }
        });
        let linkedLine: {
            point: Point[];
            slaveId: string;
        }[][] = [];
        linkedLines.forEach((Element) => {
            linkedLine.push(this.findSlaves(centroid, Element, allSlaves, tL));
        });
        let triang = linkedLine.map(function (element, index) {
            return {
                linkedLine: element,
                linkedMiddlePoint: linkedPoints[index],
            };
        });
        return {
            lines: sendLines,
            point: points,
            middlePoint: centroid,
            triang,
            ID: slave.slaveID,
        };
    }

    findSlaves(middle: Point, line: Line, slaves: SlaveScreen[], tL: Point) {
        let points: {
            point: Point[];
            slaveId: string;
        }[] = [];
        slaves.forEach((element) => {
            let inter = this.findIntersections(line, element, tL);
            if (inter.length > 0) {
                if (inter.length == 1) {
                    inter.push(element.centroid.copyTranslated(-tL.x, -tL.y));
                }
                points.push({ point: inter, slaveId: element.slaveID });
            }
        });
        const endPoints = line.endPoints;
        let diff = {
            x: endPoints[1].x - endPoints[0].x,
            y: endPoints[1].y - endPoints[0].y,
        };
        if (endPoints[1].equals(middle)) {
            diff.x *= -1;
            diff.y *= -1;
        }
        points.forEach((element) => {
            const point = element.point;
            const pdiffx = point[1].x - point[0].x;
            const pdiffy = point[1].y - point[0].y;
            if (
                Math.sign(pdiffx) != Math.sign(diff.x) ||
                (Math.sign(pdiffx) == 0 &&
                    Math.sign(pdiffy) != Math.sign(diff.y))
            ) {
                point.reverse();
            }
        });
        return points;
    }

    findIntersections(line: Line, slave: SlaveScreen, tL: Point) {
        const endPoints = line.endPoints;
        //deze volgorde maakt op zich niet zo veel uit
        const leftUp = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.LeftUp),
            slave,
            tL
        );
        const rightUp = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.RightUp),
            slave,
            tL
        );
        const leftUnder = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.LeftUnder),
            slave,
            tL
        );
        const rightUnder = this.stringToPoint(
            slave.mapActualToMasterCornerLabel(CornerLabels.RightUnder),
            slave,
            tL
        );
        let cuttingPoints: Point[] = [];

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
            cuttingPoints.push(new Point(Up.point.x, Up.point.y));
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
            cuttingPoints.push(new Point(Right.point.x, Right.point.y));
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
            cuttingPoints.push(new Point(Left.point.x, Left.point.y));
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
            cuttingPoints.push(new Point(Under.point.x, Under.point.y));
        }
        return cuttingPoints;
    }

    stringToPoint(corner: CornerLabels, slave: SlaveScreen, tL: Point) {
        if (corner == CornerLabels.LeftUp) {
            return slave.sortedCorners.LeftUp.copyTranslated(-tL.x, -tL.y);
        }

        if (corner == CornerLabels.LeftUnder) {
            return slave.sortedCorners.LeftUnder.copyTranslated(-tL.x, -tL.y);
        }

        if (corner == CornerLabels.RightUp) {
            return slave.sortedCorners.RightUp.copyTranslated(-tL.x, -tL.y);
        }

        if (corner == CornerLabels.RightUnder) {
            return slave.sortedCorners.RightUnder.copyTranslated(-tL.x, -tL.y);
        }
    }

    // //lijst moet gesorteerd zijn van links naar rechts
    // addSlaves(
    //     line: Line,
    //     slaves: Array<{ slaveId: string; points: Point[]; orient: string }>
    // ) {
    //     this.slaves.push({ line: line, slaves });
    // }

    // linkMiddlePointsToLines() {
    //     const points = this.points;
    //     const lines = this.lines;
    //     points.forEach(point => {
    //         let linesWithPoint: Line[] = [];
    //         lines.forEach(line => {
    //             if (line.endPoints.includes(point)) {
    //                 linesWithPoint.push(line);
    //             }
    //         });
    //         this.middlePoints.push({ point, lines: linesWithPoint });
    //     });
    // }
}
