import findScreen, {
    createCanvas,
} from "../../scripts/image_processing/screen_detection/screen_detection";
import Point from "../../scripts/image_processing/screen_detection/Point";
import test_runner, {
    isCorrectPoints,
    createRectangularScreensCanvas,
    TestResult,
    Tests,
    pinkRGBA,
} from "./helpers";

const CORNER_OFFSET_THRESHOLD = 50;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

export default function run_tests(
    onNewResult: (testResult: TestResult) => void,
    testNames: string[]
) {
    return test_runner(
        tests,
        (testName, expected, result, dt) => {
            return new TestResult(
                testName,
                expected,
                result,
                expected.reduce((prev, curr, index) => prev && curr === result[index]),
                dt
            );
        },
        onNewResult,
        testNames
    );
}

/// MAKE SURE THAT THE EXPECTED COORDINATES ARE INSIDE OF THE CANVAS!
const tests: Tests<boolean[]> = {
    "10x: 10% screen size": createRepeatedPercentageTest(0.1, 10),
    "10x: 20% screen size": createRepeatedPercentageTest(0.2, 10),
    "10x: 30% screen size": createRepeatedPercentageTest(0.3, 10),
    "10x: 40% screen size": createRepeatedPercentageTest(0.4, 10),
    "10x: 50% screen size": createRepeatedPercentageTest(0.5, 10),
    "10x: 60% screen size": createRepeatedPercentageTest(0.6, 10),
    "10x: 70% screen size": createRepeatedPercentageTest(0.7, 10),
    "10x: 80% screen size": createRepeatedPercentageTest(0.8, 10),
    "10x: 90% screen size": createRepeatedPercentageTest(0.9, 10),
    "10x: 100% screen size": createRepeatedPercentageTest(1, 10),
};

function createRepeatedPercentageTest(percentage: number, repeats: number) {
    return async () => {
        const percentageTest = async () => {
            const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
            const blancoCtx = blanoCanvas.getContext("2d");
            blancoCtx.fillStyle = "rgb(0, 0, 0)";
            blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
            const expected = [
                new Point(0, 0),
                new Point(DEFAULT_WIDTH * percentage, 0),
                new Point(DEFAULT_WIDTH * percentage, DEFAULT_HEIGHT * percentage),
                new Point(0, DEFAULT_HEIGHT * percentage),
            ];
            const coloredCanvas = createRectangularScreensCanvas(
                expected,
                pinkRGBA,
                DEFAULT_WIDTH,
                DEFAULT_HEIGHT
            );
            const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
            return { expected, result };
        }

        const result = [];
        const expected = new Array(repeats).fill(true);
        for (let i = 0; i < repeats; i++) {
            const localResult = await percentageTest();
            result.push(isCorrectPoints(localResult.expected, localResult.result, CORNER_OFFSET_THRESHOLD))
        }
        return { expected, result }
    }
}