import Point from "../image_processing/screen_detection/Point";
import { BoundingBox } from "./BoundingBox";

export default class SlaveScreen {
    corners: Point[];
    boundingBox: BoundingBox;
    slaveID: string;
    orientation: number | undefined;
    slavePortionImg: HTMLCanvasElement;

    constructor(corners: Point[], slaveID: string) {
        this.corners = corners;
        this.slaveID = slaveID;
        this.boundingBox = new BoundingBox(corners);
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

    public copy(): SlaveScreen {
        const screen = new SlaveScreen(this.corners, this.slaveID);
        screen.orientation = this.orientation;
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }
}
