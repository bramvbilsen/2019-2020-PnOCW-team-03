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

    sendData(slave: SlaveScreen, allSlaves: SlaveScreen[]) {
        const sendLines = this.lines.map(element => {
            return {
                x1: element.a.x,
                y1: element.a.y,
                x2: element.b.x,
                y2: element.b.y,
            };
        });
        const points = this.points.map(function(element) {
            return { x: element.x, y: element.y };
        });
        let centroid = slave.centroid;
        let linkedLines: Line[] = [];
        let linkedPoints: Point[] = [];
        this.lines.forEach(line => {
            if (line.endPoints[0].equals(centroid)) {
                linkedLines.push(line);
                linkedPoints.push(line.endPoints[0]);
            }
            if (line.endPoints[1].equals(centroid)) {
                linkedLines.push(line);
                linkedPoints.push(line.endPoints[0]);
            }
        });
        let linkedLine: {
            point: { x: number; y: number };
            slaveId: string;
        }[][];
        linkedLines.forEach(Element => {
            linkedLine.push(this.findSlaves(centroid, Element, allSlaves));
        });
        let triang = linkedLine.map(function(element, index) {
            return {
                linkedLine: element,
                linkedMiddlePoint: {
                    x: linkedPoints[index].x,
                    y: linkedPoints[index].y,
                },
            };
        });
        return {
            lines: sendLines,
            point: points,
            middlePoint: { x: centroid.x, y: centroid.y },
            triang,
            ID: slave.slaveID,
        };
    }

    findSlaves(middle: Point, line: Line, slaves: SlaveScreen[]) {
        let points: {
            point: Point;
            slaveId: string;
        }[] = [];
        slaves.forEach(element => {
            let inter = this.findIntersections(line, element);
            for (let index = 0; index < inter.length; index++) {
                points.push({ point: inter[index], slaveId: element.slaveID });
            }
        });
        points.sort(function(a, b) {
            let point1 = a.point;
            let point2 = b.point;
            //points van links naar reecht(als gelijk van boven naar onder)
            if (point1.x - point2.x == 0) {
                return point1.y - point2.y;
            } else {
                return point1.x - point2.x;
            }
        });
        let otherPoint: Point;
        if (middle.equals(line.endPoints[0])) {
            otherPoint = line.endPoints[1];
        } else {
            otherPoint = line.endPoints[0];
        }
        if (
            middle.x - otherPoint.x > 0 ||
            (middle.x - otherPoint.x == 0 && middle.y - otherPoint.y > 0)
        ) {
            points.reverse();
        }
        let returnstr = points.map(element => {
            return {
                point: { x: element.point.x, y: element.point.y },
                slaveId: element.slaveId,
            };
        });
        return returnstr;
    }

    findIntersections(line: Line, slave: SlaveScreen) {
        const endPoints = line.endPoints;
        //deze volgorde maakt op zich niet zo veel uit
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

    stringToPoint(corner: CornerLabels, slave: SlaveScreen) {
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
