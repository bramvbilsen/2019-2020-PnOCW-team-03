import Point from "../image_processing/screen_detection/Point";
import { BoundingBox } from "./BoundingBox";
import Line from "../image_processing/screen_detection/Line";
import { rotatePointsAroundCenter } from "../../tests/image_processing/helpers";
import { radiansToDegrees } from "./angles";

export default class SlaveScreen {
    corners: Point[];
    slaveID: string;
    orientation: number | undefined;
    slavePortionImg: HTMLCanvasElement;

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

    // TODO: This should be fixed because it won't work for portrait oriented devices.
    get width(): number {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        return Math.max(edgeA.length, edgeB.length, edgeC.length, edgeD.length);
    }

    // TODO: This should be fixed because it won't work for portrait oriented devices.
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
