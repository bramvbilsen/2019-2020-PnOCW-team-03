import Point from "../image_processing/screen_detection/Point";
import { BoundingBox } from "./BoundingBox";
import Line from "../image_processing/screen_detection/Line";

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
    /** currently, this will always return the longest connection between the points. */
    get width(): number {
        const connections: Line[] = [];
        this.corners.forEach((corner, index) => {
            for (let i = index; i < this.corners.length; i++) {
                connections.push(new Line(corner, this.corners[i]));
            }
        });
        const sortedConnections = connections.sort(
            (connectionA, connectionB) =>
                connectionB.length - connectionA.length
        );
        return sortedConnections[0].length;
    }

    // TODO: This should be fixed because it won't work for portrait oriented devices.
    /** currently, this will always return the shortest connection between the points. */
    get height(): number {
        const connections: Line[] = [];
        this.corners.forEach((corner, index) => {
            for (let i = index; i < this.corners.length; i++) {
                connections.push(new Line(corner, this.corners[i]));
            }
        });
        const sortedConnections = connections.sort(
            (connectionA, connectionB) =>
                connectionA.length - connectionB.length
        );
        return sortedConnections[0].length;
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
