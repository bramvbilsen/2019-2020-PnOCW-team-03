import { IPoint } from "../../types/Points";

export default class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the distance between this point and the given one.
     * @param point The other point.
     */
    distanceTo(point: Point) {
        return Math.sqrt(
            Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
        );
    }

    /**
     * Returns the x- and y-value of this point as an IPoint interface.
     */
    toInterface(): IPoint {
        return { x: this.x, y: this.y };
    }

    /**
     * Returns a string representation of this point.
     */
    toString() {
        return JSON.stringify({ x: this.x, y: this.y });
    }

    /**
     * Returns a copy of this point.
     */
    copy = () => new Point(this.x, this.y);

    /**
     * Returns a copy of this point with the change in x- and y-value added.
     */
    copyTranslated = (dx: number, dy: number) =>
        new Point(this.x + dx, this.y + dy);

    /**
     * Returns whether or not the two points are considered to be equal.
     * @param point The other point.
     * @param epsilon The precision used in the comparison is 10^epsilon.
     */
    equals(point: Point, epsilon?: number) {
        if (!epsilon) {
            return this.x === point.x && this.y === point.y;
        }
        if (Math.abs(point.x - this.x) > Math.pow(10, epsilon)) return false;
        if (Math.abs(point.y - this.y) > Math.pow(10, epsilon)) return false;

        return true;
    }
}
