import { createCanvas } from "../../scripts/image_processing/screen_detection/screen_detection";
import calculateOrientation from "../../scripts/image_processing/orientation_detection/orientation_detection_alternative";
import SlaveScreen from "../../scripts/util/SlaveScreen";
import Point from "../../scripts/image_processing/screen_detection/Point";
import test_runner, {
    TestResult,
    Tests
} from "./helpers";
import { rotatePointAroundAnchor } from "../../scripts/util/angles";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

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

const tests: Tests<number> = {
    "No rotation": async function () {
        const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blancoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        calculateOrientation(new SlaveScreen([], "1"), blancoCanvas);

        const corners = [
            new Point(0, 0),
            new Point(100, 0),
            new Point(100, 50),
            new Point(0, 50),

        ]
        const screen = new SlaveScreen(corners, "1");
        const angle = screen.widthEdge.angleBetweenEndpoints;

        return { expected: 0, result: angle };
    }
};
