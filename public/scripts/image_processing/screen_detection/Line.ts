import Point from "./Point";
import Circle from "../Triangulation/Circle";
var gauss = require("gaussian-elimination");

export default class Line {
    a: Point;
    b: Point;

    constructor(a: Point, b: Point) {
        this.a = a;
        this.b = b;
    }

    get middlePoint() {
        return new Point((this.a.x + this.b.x) / 2, (this.a.y + this.b.y) / 2);
    }

    get endPoints() {
        return [this.a, this.b];
    }

    get length() {
        return Math.sqrt(
            Math.pow(this.b.x - this.a.x, 2) + Math.pow(this.b.y - this.a.y, 2)
        );
    }

    get rico() {
        return (this.endPoints[1].y - this.endPoints[0].y) /
            (this.endPoints[1].x - this.endPoints[0].x);
    }

    copy() {
        return new Line(this.a.copy(), this.b.copy());
    }

    /**
     * Will return an angle between 0 and 179 deg.
     */
    angleBetweenEndpoints(aroundMostRight?: boolean): number {
        const sorted = this.endPoints.sort((a, b) =>
            aroundMostRight ? b.x - a.x : a.x - b.x
        );
        const a = sorted[0];
        const b = sorted[1];
        const angle = (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
        if (angle === 180) {
            return 0;
        }
        return angle;
    }

    lineAbove(line: Line, index: number) {
        let sameEndPoint;
        let otherPoint;
        if (line.endPoints[0] == this.endPoints[index]) {
            sameEndPoint = line.endPoints[0];
            otherPoint = line.endPoints[1];
        } else {
            sameEndPoint = line.endPoints[1];
            otherPoint = line.endPoints[0];
        }
        let rico =
            (this.endPoints[1].y - this.endPoints[0].y) /
            (this.endPoints[1].x - this.endPoints[0].x);
        if (
            this.endPoints[index].y +
            rico * (otherPoint.x - this.endPoints[index].x) <
            otherPoint.y
        ) {
            return true;
        } else {
            return false;
        }
    }

    //kan best korter worden gemaakt
    surroundingCircle(line2: Line, line3: Line) {
        //middelpunten
        let midd = [];
        midd.push(this.middlePoint);
        midd.push(line2.middlePoint);
        midd.push(line3.middlePoint);

        //rico's
        let ricos = [];
        ricos.push(-1 / ((this.a.y - this.b.y) / (this.a.x - this.b.x)));
        ricos.push(-1 / ((line2.a.y - line2.b.y) / (line2.a.x - line2.b.x)));
        ricos.push(-1 / ((line3.a.y - line3.b.y) / (line3.a.x - line3.b.x)));
        let constant = [];
        for (let i = 0; i < ricos.length; i++) {
            constant.push(midd[i].y - ricos[i] * midd[i].x);
        }
        //vergelijkingen maken en oplossen
        let equations = [];
        var A = [
            [-1 * ricos[0], 1, 0],
            [-1 * ricos[1], 1, 0],
            [-1 * ricos[2], 1, 0],
        ];
        var B = [constant[0], constant[1], constant[2]];
        for (let i = 0; i < ricos.length; i++) {
            if (!isFinite(constant[i])) {
                A[i] = [1, 0, 0];
                B[i] = midd[i].x;
            }
        }
        for (let i = 0; i < 3; i++) {
            A[i].push(B[i]);
        }
        let solution = gauss(A);
        var middPoint = new Point(solution[0], solution[1]);
        var radius = Math.sqrt(
            Math.pow(this.a.x - middPoint.x, 2) +
            Math.pow(this.a.y - middPoint.y, 2)
        );
        var circle = new Circle(middPoint, radius);
        return circle;
    }

    /**
     * 
     * @param line2 
     * @param index 0 is counterclockwise and 1 is clockwise.
     */
    angle(line2: Line, index: number) {
        let points1 = this.endPoints;
        let points2 = line2.endPoints;
        //overlap
        let points = [];
        let over;
        if (points1[0] != points2[0] && points1[0] != points2[1]) {
            points.push(points1[0]);
            over = points1[1];
        } else {
            points.push(points1[1]);
            over = points1[0];
        }

        if (points2[0] != points1[0] && points2[0] != points1[1]) {
            points.push(points2[0]);
        } else {
            points.push(points2[1]);
        }

        let theta =
            ((Math.atan2(points[1].y - over.y, points[1].x - over.x) -
                Math.atan2(points[0].y - over.y, points[0].x - over.x)) *
                180) /
            Math.PI;

        if (index == 0) {
            if (theta < 0) {
                theta = 360 + theta;
            }
        } else {
            if (theta > 0) {
                theta = 360 - theta;
            } else {
                theta *= -1;
            }
        }

        return theta;
    }

    equals(line: Line) {
        if (this.a.equals(line.a) && this.b.equals(line.b)) return true;
        if (this.a.equals(line.b) && this.b.equals(line.a)) return true;
        return false;
    }
}
