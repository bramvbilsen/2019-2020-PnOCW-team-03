import Point from "./Point";

export default class Line {
    a: Point;
    b: Point;

    constructor(a: Point, b: Point) {
        this.a = a;
        this.b = b;
    }

    get endPoints() {
        return [this.a, this.b];
    }

    get length() {
        return Math.sqrt(
            Math.pow(this.b.x - this.a.x, 2) + Math.pow(this.b.y - this.a.y, 2)
        );
    }
}