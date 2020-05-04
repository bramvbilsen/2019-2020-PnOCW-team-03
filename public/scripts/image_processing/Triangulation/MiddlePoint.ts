import Point from "../screen_detection/Point";

//TODO: class herbekijken
export interface linkedMiddlePoint {
    linkedLine: linkedLine[];
    linkedMiddlePoint: Point;
}

export interface linkedLine {
    point: Point[];
    slaveId: string;
}

export default class MiddlePoint {
    middlePoint: Point;
    linkedMiddlePoints: linkedMiddlePoint[];

    constructor(middlePoint: Point, linkedMiddlePoints: linkedMiddlePoint[]) {
        this.middlePoint = middlePoint;
        this.linkedMiddlePoints = linkedMiddlePoints;
    }

    /**
     * Chooses a random point that is linked with this.middlePoint following the triangulation
     * returns that point + the slaves it needs to cross to get there(linkedLine)
     */
    next() {
        return this.linkedMiddlePoints[
            Math.floor(Math.random() * this.linkedMiddlePoints.length)
        ];
    }
}
