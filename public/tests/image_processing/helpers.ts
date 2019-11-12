import Point from "../../scripts/image_processing/screen_detection/Point";
import { IRGBAColor } from "../../scripts/types/Color";
import findScreen, {
    createCanvas,
} from "../../scripts/image_processing/screen_detection/screen_detection";

export const pinkRGBA: IRGBAColor = {
    r: 255,
    g: 70,
    b: 181,
    a: 100,
};

/**
 *
 * @param tests
 * @param createResult
 * @param onNewResult
 * @returns A promise holding the total execution time.
 */
export default async function test_runner<T>(
    tests: Tests<T>,
    createResult: (
        testName: string,
        expected: T,
        result: T,
        dt: number
    ) => TestResult,
    onNewResult: (testResult: TestResult) => void
): Promise<number> {
    const startTime = new Date();
    const testCompletion: Array<Promise<void>> = [];
    Object.entries(tests).forEach(([testName, test]) => {
        testCompletion.push(
            new Promise((resolve, reject) => {
                const t0 = new Date();
                test().then(({ expected, result }) => {
                    onNewResult(
                        createResult(
                            testName,
                            expected,
                            result,
                            +new Date() - +t0
                        )
                    );
                    resolve();
                });
            })
        );
    });
    await Promise.all(testCompletion);
    return +new Date() - +startTime;
}

export interface Tests<T> {
    [testName: string]: () => Promise<{ expected: T; result: T }>;
}

export class TestResult {
    /**
     * Test name
     */
    name: string;
    /**
     * Time it took for the test to complete.
     */
    dt: number;
    /**
     * Expected result
     */
    expected: any;
    /**
     * Actual result
     */
    result: any;
    /**
     * Whether test succeeded or not.
     */
    success: boolean;

    constructor(
        name: string,
        expected: any,
        result: any,
        success: boolean,
        dt: number
    ) {
        this.name = name;
        this.expected = expected;
        this.result = result;
        this.dt = dt;
        this.success = success;
    }

    get htmlMsg() {
        return `${this.success ? "✅" : "❌"} <b>${this.name}</b>: ${
            this.success
                ? ""
                : "<br/>Expected: " +
                  JSON.stringify(this.expected) +
                  "<br/>But got: " +
                  JSON.stringify(this.result)
        }<br/>  ⏳ Executed in: ${this.dt}ms<br/><br/>`;
    }

    get msg() {
        return `${this.success ? "✅" : "❌"} \n${this.name}\n: ${
            this.success
                ? ""
                : "\nExpected: " +
                  JSON.stringify(this.expected) +
                  "\nBut got: " +
                  JSON.stringify(this.result)
        }\n  ⏳ Executed in: ${this.dt}ms\n\n`;
    }
}

export function createResultMsg<T>(
    isCorrect: boolean,
    result: T,
    expected: T,
    extra?: string
) {
    if (isCorrect) {
        return `Success ✅${extra ? "\n" + extra : ""}`;
    } else {
        return `Error ❌: <br/>    Expected: ${expected}<br/>    But got: ${result}${
            extra ? "<br/>" + extra : ""
        }`;
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

export function centerScreenInSpace(
    screenWidth: number,
    screenHeight: number,
    spaceWidth: number,
    spaceHeight: number
) {
    const leftX = screenWidth - 1280 * 0.25;
    const topY = screenHeight - 720 * 0.25;
    return [
        new Point(leftX, topY),
        new Point(spaceWidth - leftX, topY),
        new Point(spaceWidth - leftX, spaceHeight - topY),
        new Point(leftX, spaceHeight - topY),
    ];
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
