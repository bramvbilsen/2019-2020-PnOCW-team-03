import Point from "../image_processing/screen_detection/Point";
import { BoundingBox } from "./BoundingBox";
import Line from "../image_processing/screen_detection/Line";
import { radiansToDegrees } from "./angles";
import { Orientation } from "../image_processing/orientation_detection/orientations";
import { sortCorners } from "./shapes";

export default class SlaveScreen {
    corners: Point[];
    slaveID: string;
    orientation: Orientation | undefined;
    slavePortionImg: HTMLCanvasElement;
    topleft: Point;
    topRight: Point;
    angleScreen: number;
    triangulation: {
        //de lijnen die zeker moeten getekend worden
        angles: Array<{ string: string; point: Point }>;
        lines: Array<{ string: string; point1: Point; point2: Point }>;
    } = {
        angles: [],
        lines: [],
    };

    constructor(corners: Point[], slaveID: string) {
        this.corners = corners;
        this.slaveID = slaveID;
    }

    get centroid(): Point {
        let sumX = 0;
        let sumY = 0;
        this.corners.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        });
        return new Point(
            Math.round(sumX / this.corners.length),
            Math.round(sumY / this.corners.length)
        );
    }

    get boundingBox() {
        return new BoundingBox(this.corners);
    }

    get width(): number {
        return this.widthEdge.length;
    }

    get height(): number {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        const width = Math.max(
            edgeA.length,
            edgeB.length,
            edgeC.length,
            edgeD.length
        );
        if (width === edgeA.length || width === edgeC.length) {
            return Math.max(edgeB.length, edgeD.length);
        } else {
            return Math.max(edgeA.length, edgeC.length);
        }
    }

    /**
     * Returns the angle in degrees. From 0-359.9
     */
    get angle(): number {
        this.angleScreen = this.calcAngle();
        return this.angleScreen;
    }

    public calcAngle():number{
        let topScreenEdge: Line = new Line(this.topleft, this.topRight);
        let angle = topScreenEdge.angleBetweenEndpoints();
        switch (this.orientation) {
            case Orientation.NORMAL:
                if (angle === 90) {
                    return angle - 90;
                }
                else if (angle > 45 && angle < 90) {
                    return 360-(90-angle);
                }
                else if(angle > 90 && angle <= 135){
                    return angle-90;
                }
                else if (angle < 45) {
                    this.orientation = Orientation.COUNTERCLOCKWISE;
                    return this.calcAngle();
                }
                else if (angle > 135) {
                    this.orientation = Orientation.CLOCKWISE;
                    return this.calcAngle();
                }
                break;

            case Orientation.CLOCKWISE:
                if (angle === 0) {
                    return 90;
                }
                else if (angle > 45 && angle < 90) {
                    this.orientation = Orientation.FLIPPED;
                    return this.calcAngle();
                }
                else if (angle <= 45) {
                    return angle+90;
                }
                else if (angle >= 135 && angle < 180) {
                    return angle;
                }
                else if (angle >= 90 && angle < 135){
                    this.orientation = Orientation.NORMAL;
                    return this.calcAngle();
                }
                break;

            case Orientation.FLIPPED:
                if (angle === 90) {
                    return angle+90;
                }
                else if (angle > 45 && angle < 90) {
                    return angle+90;
                }
                else if (angle <= 45) {
                    this.orientation = Orientation.CLOCKWISE;
                    return this.calcAngle();
                }
                else if (angle >= 135 && angle < 180) {
                    this.orientation = Orientation.COUNTERCLOCKWISE;
                    return this.calcAngle();
                }
                else if (angle >= 90 && angle < 135){
                    return (angle-90)+180;
                }
                break;

            case Orientation.COUNTERCLOCKWISE:
                if (angle === 0){
                    return 270;
                }
                else if (angle <= 45){
                    return angle+270;
                }
                else if (angle > 45 && angle < 90){
                    this.orientation = Orientation.NORMAL;
                    return this.calcAngle();
                }
                else if (angle >= 90 && angle < 135){
                    this.orientation = Orientation.FLIPPED;
                    return this.calcAngle();
                }
                else if (angle >= 135 && angle < 180){
                    return 270-(180-angle);
                }
                break;
        }
    }

    // TODO: This should be fixed because it won't work for portrait oriented devices.
    /**
     * Edge representing the width of the screen
     */
    get widthEdge(): Line {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        const longestLength = Math.max(
            edgeA.length,
            edgeB.length,
            edgeC.length,
            edgeD.length
        );
        if (edgeA.length === longestLength) return edgeA;
        if (edgeB.length === longestLength) return edgeB;
        if (edgeC.length === longestLength) return edgeC;
        if (edgeD.length === longestLength) return edgeD;
    }

    // TODO: This should be fixed because it won't work for portrait oriented devices.
    /**
     * Edge representing the height of the screen
     */
    get heightEdge(): Line {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        const width = Math.max(
            edgeA.length,
            edgeB.length,
            edgeC.length,
            edgeD.length
        );
        if (width === edgeA.length || width === edgeC.length) {
            const longestLength = Math.max(edgeB.length, edgeD.length);
            if (longestLength === edgeB.length) return edgeB;
            if (longestLength === edgeD.length) return edgeD;
        } else {
            const longestLength = Math.max(edgeA.length, edgeC.length);
            if (longestLength === edgeA.length) return edgeA;
            if (longestLength === edgeC.length) return edgeC;
        }
    }

    get topLeftCorner(): Point {
        const corners = [...this.corners];
        corners.sort((a, b) => a.y - b.y);
        if (corners[0].x < corners[1].x) {
            return corners[0];
        } else {
            return corners[1];
        }
    }

    get sortedCorners(): {
        LeftUp: Point;
        RightUp: Point;
        RightUnder: Point;
        LeftUnder: Point;
    } {
        return sortCorners(this.corners);
    }

    public sortCornersByAngle() {
        const center = this.centroid;
        // Sorting by https://math.stackexchange.com/questions/978642/how-to-sort-vertices-of-a-polygon-in-counter-clockwise-order
        this.corners.sort((a, b) => {
            const a1 =
                (radiansToDegrees(Math.atan2(a.x - center.x, a.y - center.y)) +
                    360) %
                360;
            const a2 =
                (radiansToDegrees(Math.atan2(b.x - center.x, b.y - center.y)) +
                    360) %
                360;
            return a1 - a2;
        });
    }

    public copy(): SlaveScreen {
        const screen = new SlaveScreen(this.corners, this.slaveID);
        screen.orientation = this.orientation;
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }

    /**
     * Copies the screen and moves it as close as possible to (0, 0) while keeping all coordinates positive.
     */
    public copyAndMoveAsCloseToOriginAsPossible(): SlaveScreen {
        const corners = [...this.corners];
        const moveY = corners.sort((a, b) => a.y - b.y)[0].y;
        const moveX = corners.sort((a, b) => a.x - b.x)[0].x;
        corners.forEach(corner => {
            corner.x -= moveX;
            corner.y -= moveY;
        });

        const screen = new SlaveScreen(corners, this.slaveID);
        screen.orientation = this.orientation;
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }
}
