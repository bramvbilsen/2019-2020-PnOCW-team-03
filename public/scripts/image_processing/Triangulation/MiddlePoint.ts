import Point from "../screen_detection/Point";

export interface linkedMiddlePoint {
    slaveIds: string[];
    linkedMiddlePoint: Point;
}

export default class MiddlePoint {
    middlePoint: Point;
    linkedMiddlePoints: linkedMiddlePoint[];

    constructor(middlePoint: Point, linkedMiddlePoints: linkedMiddlePoint[]) {
        this.middlePoint = middlePoint;
        this.linkedMiddlePoints = linkedMiddlePoints;
    }

    next() {
        return this.linkedMiddlePoints[
            Math.floor(Math.random() * this.linkedMiddlePoints.length)
        ];
    }
}
