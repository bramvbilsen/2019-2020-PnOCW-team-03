import Point from "../../scripts/image_processing/screen_detection/Point";
import { IRGBAColor } from "../../scripts/types/Color";
import findScreen, {
    createCanvas,
} from "../../scripts/image_processing/screen_detection/screen_detection";

export function correct<T>(isCorrect: boolean, result: T, expected: T) {
    if (isCorrect) {
        return "Success ✅";
    } else {
        return `Error ❌: \n    Expected: ${expected}\n    But got: ${result}`;
    }
}

export function isCorrectPoints(
    expected: Point[],
    result: Point[],
    CORNER_OFFSET_THRESHOLD: number
): boolean {
    if (expected.length !== result.length) return false;
    let correct = true;
    expected.forEach(expectedPoint => {
        const similarPoint = result.find(resultPoint =>
            pointsAreMoreOrLessEqual(
                expectedPoint,
                resultPoint,
                CORNER_OFFSET_THRESHOLD
            )
        );
        if (!similarPoint) {
            correct = false;
        } else {
            result = result.filter(resultPoint => similarPoint !== resultPoint);
        }
    });
    return correct;
}

function getCentroidOf(points: Point[]): Point {
    var sumX = 0;
    var sumY = 0;
    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
    });
    return new Point(
        Math.round(sumX / points.length),
        Math.round(sumY / points.length)
    );
}

// From https://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
export function rotatePointsAroundCenter(points: Point[], angle: number) {
    const center = getCentroidOf(points);
    const result: Point[] = [];
    points.forEach(point => {
        const radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx =
                cos * (point.x - center.x) +
                sin * (point.y - center.y) +
                center.x,
            ny =
                cos * (point.y - center.y) -
                sin * (point.x - center.x) +
                center.y;
        result.push(new Point(nx, ny));
    });
    return result;
}

export function createRectangularScreensCanvas(
    points: Point[],
    color: IRGBAColor,
    canvasWidth: number,
    canvasHeight: number
) {
    const screen = Screen.unordered(points);
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.beginPath();
    ctx.moveTo(screen.topLeft.x, screen.topLeft.y);
    ctx.lineTo(screen.topRight.x, screen.topRight.y);
    ctx.lineTo(screen.bottomRight.x, screen.bottomRight.y);
    ctx.lineTo(screen.bottomLeft.x, screen.bottomLeft.y);
    ctx.fill();
    ctx.closePath();
    return canvas;
}

export function pointsAreMoreOrLessEqual(
    a: Point,
    b: Point,
    threshold: number
) {
    return Math.abs(a.x - b.x) <= threshold && Math.abs(a.y - b.y) <= threshold;
}

export class Screen {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;

    clockwisePoints: Point[];

    constructor(
        topLeft: Point,
        topRight: Point,
        bottomLeft: Point,
        bottomRight: Point
    ) {
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;
        this.clockwisePoints = [topLeft, topRight, bottomLeft, bottomRight];
    }

    /**
     *
     * @param points Top left - top right - bottom right - bottom left
     */
    static clockwise(points: Point[]) {
        return new Screen(points[0], points[1], points[2], points[3]);
    }

    static unordered(points: Point[]) {
        const pointsSortedByX = points.sort((a, b) => a.x - b.x);
        const mostLeft = [pointsSortedByX[0], pointsSortedByX[1]];
        const mostRight = [pointsSortedByX[2], pointsSortedByX[3]];
        const [topLeft, bottomLeft] = mostLeft.sort((a, b) => a.x - b.x);
        const [topRight, bottomRight] = mostRight.sort((a, b) => a.x - b.x);
        return new Screen(topLeft, topRight, bottomLeft, bottomRight);
    }
}
