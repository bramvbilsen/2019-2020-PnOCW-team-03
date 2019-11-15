import { createCanvas } from "../../scripts/image_processing/screen_detection/screen_detection";
import getOrientation from "../../scripts/image_processing/orientation_detection/orientation_detection";
import SlaveScreen from "../../scripts/util/SlaveScreen";
import Point from "../../scripts/image_processing/screen_detection/Point";
import test_runner, {
    isCorrectPoints,
    createRectangularScreensCanvas,
    rotatePointsAroundCenter,
    TestResult,
    Tests,
    pinkRGBA,
} from "./helpers";

const ORIENTATION_OFFSET_THRESHOLD = 50;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const topLeftColor = "rgb(255, 70, 180)";
const topRightColor = "rgb(0, 255, 25)";
const bottomLeftColor = "rgb(255, 216, 0)";
const bottomRightColor = "rgb(12, 0, 255)";

export default function run_tests(
    onNewResult: (testResult: TestResult) => void,
    testNames?: string[]
) {
    return test_runner(
        tests,
        (testName, expected, result, dt) => {
            return new TestResult(
                testName,
                expected,
                result,
                expected === result,
                dt
            );
        },
        onNewResult,
        testNames
    );
}

/// MAKE SURE THAT THE EXPECTED COORDINATES ARE INSIDE OF THE CANVAS!
const tests: Tests<number> = {
    "No points": async function () {
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        getOrientation(new SlaveScreen([], "1"), blanoCanvas);
        return { expected: 0, result: 0 };
    },
    "Points but no colored screen": async function () {
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        getOrientation(
            new SlaveScreen(
                [
                    new Point(0, 0),
                    new Point(0, 50),
                    new Point(50, 0),
                    new Point(50, 50),
                ],
                "1"
            ),
            blanoCanvas
        );
        return { expected: 0, result: 0 };
    },
    "No orientation": async function () {
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const orientationColorsCanvas = createCanvas(
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const orientationColorsCtx = orientationColorsCanvas.getContext("2d");
        const points = [
            new Point(0, 0),
            new Point(0, 50),
            new Point(50, 0),
            new Point(50, 50),
        ];
        orientationColorsCtx.fillStyle = topLeftColor;
        orientationColorsCtx.fillRect(
            points[0].x,
            points[0].y,
            points[3].x / 2,
            points[3].y / 2
        );
        orientationColorsCtx.fillStyle = bottomLeftColor;
        orientationColorsCtx.fillRect(
            points[1].x,
            points[1].y / 2,
            points[3].x / 2,
            points[3].y / 2
        );
        orientationColorsCtx.fillStyle = topRightColor;
        orientationColorsCtx.fillRect(
            points[1].x / 2,
            points[1].y,
            points[3].x / 2,
            points[3].y / 2
        );
        orientationColorsCtx.fillStyle = topRightColor;
        orientationColorsCtx.fillRect(
            points[1].x / 2,
            points[1].y / 2,
            points[3].x / 2,
            points[3].y / 2
        );
        blancoCtx.drawImage(orientationColorsCanvas, points[0].x, points[0].y);

        const result = getOrientation(
            new SlaveScreen(
                [
                    new Point(0, 0),
                    new Point(0, 50),
                    new Point(50, 0),
                    new Point(50, 50),
                ],
                "1"
            ),
            blanoCanvas
        );
        return { expected: 0, result };
    },
};
