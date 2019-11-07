import Point from "../image_processing/screen_detection/Point";

export default class SlaveScreen {
    corners: Point[];
    slaveID: string;

    constructor(corners: Point[], slaveID: string) {
        this.corners = corners;
        this.slaveID = slaveID;
    }

    get centroid(): Point {
        var sumX = 0;
        var sumY = 0;
        this.corners.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        });
        return new Point(
            Math.round(sumX / this.corners.length),
            Math.round(sumY / this.corners.length)
        );
    }
}
