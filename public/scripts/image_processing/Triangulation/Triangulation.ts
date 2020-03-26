import Point from "../screen_detection/Point";
import Line from "../screen_detection/Line";

export default class Triangulation {
    line: Line[];
    slaves: Array<{
        line: Line;
        slaves: Array<{ slaveId: string; points: Point[]; orient: string }>;
    }> = [];
    middlePoints: Array<{ point: Point; lines: Array<Line> }> = [];

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

    add(line: Line) {
        this.lines.concat(line);
    }

    copyLines() {
        return this.lines.map(line => line.copy());
    }

    copyMiddlePoints() {
        return this.middlePoints.map(middlePoint => ({
            point: middlePoint.point.copy(),
            lines: middlePoint.lines.map(line => line.copy()),
        }));
    }

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

    //lijst moet gesorteerd zijn van links naar rechts
    addSlaves(
        line: Line,
        slaves: Array<{ slaveId: string; points: Point[]; orient: string }>
    ) {
        this.slaves.push({ line: line, slaves });
    }

    linkMiddlePointsToLines() {
        const points = this.points;
        const lines = this.lines;
        points.forEach(point => {
            let linesWithPoint: Line[] = [];
            lines.forEach(line => {
                if (line.endPoints.includes(point)) {
                    linesWithPoint.push(line);
                }
            });
            this.middlePoints.push({ point, lines: linesWithPoint });
        });
    }
}
