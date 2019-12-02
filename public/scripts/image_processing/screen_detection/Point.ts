export default class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceTo(point: Point) {
        return Math.sqrt(
            Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
        );
    }

    toString() {
        return JSON.stringify({ x: this.x, y: this.y });
    }

    copy = () => new Point(this.x, this.y);

    copyTranslated = (dx: number, dy: number) => new Point(this.x + dx, this.y + dy);

    equals(point: Point, epsilon: number = -6) {
        if (Math.abs(point.x - this.x) > Math.pow(10, epsilon)) return false;
        if (Math.abs(point.y - this.y) > Math.pow(10, epsilon)) return false;

        return true;
    }
}