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

const CORNER_OFFSET_THRESHOLD = 50;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

export default function run_tests(
    onNewResult: (testResult: TestResult) => void
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
        onNewResult
    );
}

/// MAKE SURE THAT THE EXPECTED COORDINATES ARE INSIDE OF THE CANVAS!
const tests: Tests<number> = {
    "No points": async function() {
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        getOrientation(new SlaveScreen([], "1"), blanoCanvas);
        return { expected: 0, result: 0 };
    },
    "Points but no colored screen": async function() {
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
};
