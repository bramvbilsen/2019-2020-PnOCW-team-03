import Point from "./screen_detection/Point";

export class DetectionBlob {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;

    maxPixelRange: number;

    isOrientationBlob = false;

    constructor(initialPoint: Point, maxPixelRange: number) {
        this.topLeft = initialPoint;
        this.topRight = initialPoint;
        this.bottomRight = initialPoint;
        this.bottomLeft = initialPoint;
        this.maxPixelRange = maxPixelRange;
    }

    get width(): number {
        return this.topRight.x - this.topLeft.x;
    }

    get height(): number {
        return this.bottomLeft.y - this.topLeft.y;
    }

    get area(): number {
        return this.width * this.height;
    }

    get center(): Point {
        return new Point(
            this.topLeft.x + this.width / 2,
            this.topLeft.y + this.height / 2
        );
    }

    draw(ctx: CanvasRenderingContext2D, id: string) {
        ctx.beginPath();
        ctx.moveTo(this.topLeft.x, this.topLeft.y);
        ctx.lineTo(this.topRight.x, this.topRight.y);
        ctx.lineTo(this.bottomRight.x, this.bottomRight.y);
        ctx.lineTo(this.bottomLeft.x, this.bottomLeft.y);
        ctx.closePath();
        if (this.isOrientationBlob) {
            ctx.fillStyle = "green";
        } else {
            ctx.fillStyle = "red";
        }
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.fill();
        ctx.stroke();
        // ctx.fillText(id, this.center.x, this.center.y);
        // ctx.strokeText(id, this.center.x, this.center.y);
    }

    isCloseEnough(point: Point): boolean {
        const d_topLeft = point.distanceSq(this.topLeft);
        const d_topRight = point.distanceSq(this.topRight);
        const d_bottomRight = point.distanceSq(this.bottomRight);
        const d_bottomLeft = point.distanceSq(this.bottomLeft);

        const d_min = Math.min(
            d_topLeft,
            d_topRight,
            d_bottomRight,
            d_bottomLeft
        );
        return d_min <= this.maxPixelRange * this.maxPixelRange;
    }

    add(point: Point) {
        const minX = Math.min(
            point.x,
            this.topLeft.x,
            this.topRight.x,
            this.bottomRight.x,
            this.bottomLeft.x
        );
        const maxX = Math.max(
            point.x,
            this.topLeft.x,
            this.topRight.x,
            this.bottomRight.x,
            this.bottomLeft.x
        );
        const minY = Math.min(
            point.y,
            this.topLeft.y,
            this.topRight.y,
            this.bottomRight.y,
            this.bottomLeft.y
        );
        const maxY = Math.max(
            point.y,
            this.topLeft.y,
            this.topRight.y,
            this.bottomRight.y,
            this.bottomLeft.y
        );
        this.topLeft = new Point(minX, minY);
        this.topRight = new Point(maxX, minY);
        this.bottomRight = new Point(maxX, maxY);
        this.bottomLeft = new Point(minX, maxY);
    }

    matches(blob: DetectionBlob, matchRange: number) {
        const d_topLeft_1 = blob.topLeft.distanceSq(this.topLeft);
        const d_topLeft_2 = blob.topLeft.distanceSq(this.topRight);
        const d_topLeft_3 = blob.topLeft.distanceSq(this.bottomRight);
        const d_topLeft_4 = blob.topLeft.distanceSq(this.bottomLeft);
        const d_topRight_1 = blob.topRight.distanceSq(this.topLeft);
        const d_topRight_2 = blob.topRight.distanceSq(this.topRight);
        const d_topRight_3 = blob.topRight.distanceSq(this.bottomRight);
        const d_topRight_4 = blob.topRight.distanceSq(this.bottomLeft);
        const d_bottomRight_1 = blob.bottomRight.distanceSq(this.topLeft);
        const d_bottomRight_2 = blob.bottomRight.distanceSq(this.topRight);
        const d_bottomRight_3 = blob.bottomRight.distanceSq(this.bottomRight);
        const d_bottomRight_4 = blob.bottomRight.distanceSq(this.bottomLeft);
        const d_bottomLeft_1 = blob.bottomLeft.distanceSq(this.topLeft);
        const d_bottomLeft_2 = blob.bottomLeft.distanceSq(this.topRight);
        const d_bottomLeft_3 = blob.bottomLeft.distanceSq(this.bottomRight);
        const d_bottomLeft_4 = blob.bottomLeft.distanceSq(this.bottomLeft);

        const d_min = Math.min(
            blob.topLeft.distanceSq(this.topLeft),
            blob.topLeft.distanceSq(this.topRight),
            blob.topLeft.distanceSq(this.bottomRight),
            blob.topLeft.distanceSq(this.bottomLeft),
            blob.topRight.distanceSq(this.topLeft),
            blob.topRight.distanceSq(this.topRight),
            blob.topRight.distanceSq(this.bottomRight),
            blob.topRight.distanceSq(this.bottomLeft),
            blob.bottomRight.distanceSq(this.topLeft),
            blob.bottomRight.distanceSq(this.topRight),
            blob.bottomRight.distanceSq(this.bottomRight),
            blob.bottomRight.distanceSq(this.bottomLeft),
            blob.bottomLeft.distanceSq(this.topLeft),
            blob.bottomLeft.distanceSq(this.topRight),
            blob.bottomLeft.distanceSq(this.bottomRight),
            blob.bottomLeft.distanceSq(this.bottomLeft)
        );
        return d_min <= matchRange * matchRange;
    }
}
