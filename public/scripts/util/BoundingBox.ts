import SlaveScreen from "./SlaveScreen";
import Point from "../image_processing/screen_detection/Point";
import { calculateBoundingBox } from "./shapes";

export class BoundingBox {
    private _topLeft: Point;
    private _topRight: Point;
    private _bottomLeft: Point;
    private _bottomRight: Point;

    get topLeft() {
        return this._topLeft;
    }
    get topRight() {
        return this._topRight;
    }
    get bottomLeft() {
        return this._bottomLeft;
    }
    get bottomRight() {
        return this._bottomRight;
    }
    get width() {
        return this._topRight.x - this._topLeft.x;
    }
    get height() {
        return this._bottomRight.y - this._topRight.y;
    }

    constructor(points: Point[]) {
        const box = calculateBoundingBox(points);
        this._topLeft = box.topLeft;
        this._topRight = box.topRight;
        this._bottomLeft = box.bottomLeft;
        this._bottomRight = box.bottomRight;
    }
}

export class BoudingBoxOfSlaveScreens {
    private _screens: SlaveScreen[] = [];
    private _topLeft: Point;
    private _topRight: Point;
    private _bottomLeft: Point;
    private _bottomRight: Point;

    get screens() {
        return this._screens;
    }
    get topLeft() {
        return this._topLeft;
    }
    get topRight() {
        return this._topRight;
    }
    get bottomLeft() {
        return this._bottomLeft;
    }
    get bottomRight() {
        return this._bottomRight;
    }
    get width() {
        return this._topRight.x - this._topLeft.x;
    }
    get height() {
        return this._bottomRight.y - this._topRight.y;
    }

    constructor(slaveScreens: SlaveScreen[]) {
        let points: Point[] = [];
        slaveScreens.forEach(screen => {
            const newPoints: Point[] = screen.corners.map(corner =>
                corner.copy()
            );
            this._screens.push(screen.copy());
            points.push(...newPoints);
        });
        const box = calculateBoundingBox(points);
        this._topLeft = box.topLeft;
        this._topRight = box.topRight;
        this._bottomLeft = box.bottomLeft;
        this._bottomRight = box.bottomRight;
    }

    scale(factor: number) {
        this._topLeft.x = this._topLeft.x * factor;
        this._topLeft.y = this._topLeft.y * factor;
        this._topRight.x = this._topRight.x * factor;
        this._topRight.y = this._topRight.y * factor;
        this._bottomLeft.x = this._bottomLeft.x * factor;
        this._bottomLeft.y = this._bottomLeft.y * factor;
        this._bottomRight.x = this._bottomRight.x * factor;
        this._bottomRight.y = this._bottomRight.y * factor;
        this._screens.forEach(screen => {
            screen.corners.forEach(corner => {
                corner.x = corner.x * factor;
                corner.y = corner.y * factor;
            });
        });
    }
}
