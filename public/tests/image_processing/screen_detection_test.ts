import findScreen, {
    createCanvas,
} from "../../scripts/image_processing/screen_detection/screen_detection";
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
                isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
                dt
            );
        },
        onNewResult
    );
}

/// MAKE SURE THAT THE EXPECTED COORDINATES ARE INSIDE OF THE CANVAS!
const tests: Tests<Point[]> = {
    "No Screen": async function no_screen() {
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const coloredCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const coloredCtx = coloredCanvas.getContext("2d");
        coloredCtx.fillStyle = "rgb(255, 255, 255)";
        coloredCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        const expected: Point[] = [];
        return { expected, result };
    },

    "Smallest allowed screen": async function smallest_allowed_screen() {
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const expected = [
            new Point(0, 0),
            new Point(50, 0),
            new Point(50, 50),
            new Point(0, 50),
        ];
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return { expected, result };
    },

    "Ten percent screen size": async function ten_percent_screen() {
        const percentage = 0.1;
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
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
    },

    "Twenty percent screen size": async function twenty_percent_screen() {
        const percentage = 0.2;
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
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
    },

    "Thirty percent screen size": async function thirty_percent_screen() {
        const percentage = 0.3;
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
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
    },

    "Ten percent screen size & 45 degree rotation": async function ten_percent_45deg_rotated_screen() {
        const percentage = 0.1;
        const degree = 45;
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const expected = rotatePointsAroundCenter(
            [
                new Point(0, 0),
                new Point(DEFAULT_WIDTH * percentage, 0),
                new Point(
                    DEFAULT_WIDTH * percentage,
                    DEFAULT_HEIGHT * percentage
                ),
                new Point(0, DEFAULT_HEIGHT * percentage),
            ],
            degree
        );
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return { expected, result };
    },

    "Blanco canvas with random noise + Randomly generated small screen size and orientation": async function cluttered_blanco_random_rotation_and_size() {
        // Make sure the rotation does not cause points outside the canvas.
        let percentage = Math.random() % 0.4;
        while (percentage < 0.07) {
            // Make sure the min length is 50.
            percentage = Math.random() % 0.4;
        }
        // Make sure the rotation does not cause points outside the canvas.
        const degree = (Math.random() * 360) % 30;
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        blancoCtx.fillStyle = `rgb(${pinkRGBA.r}, ${pinkRGBA.g}, ${pinkRGBA.b})`;
        for (let row = 0; row < DEFAULT_HEIGHT; row++) {
            for (let column = 0; column < DEFAULT_WIDTH; column++) {
                // 20% chance that there will be clutter on this pixel.
                if (Math.random() < 0.2) {
                    blancoCtx.fillRect(column, row, 1, 1);
                }
            }
        }
        const width = DEFAULT_WIDTH * percentage;
        const height = DEFAULT_HEIGHT * percentage;
        const expected = rotatePointsAroundCenter(
            [
                new Point(width * 0.25, height * 0.25),
                new Point(width * 0.25 + width, height * 0.25),
                new Point(width * 0.25 + width, height * 0.25 + height),
                new Point(width * 0.25, height * 0.25 + height),
            ],
            degree
        );
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return { expected, result };
    },

    "Blanco canvas with random noise + 5 randomly generated small screens": async function cluttered_blanco_random_rotation_and_size_5_screens() {
        // Make sure the rotation does not cause points outside the canvas.
        let percentage = Math.random() % 0.4;
        while (percentage < 0.07) {
            // Make sure the min length is 50.
            percentage = Math.random() % 0.4;
        }
        // Make sure the rotation does not cause points outside the canvas.
        const degree = (Math.random() * 360) % 30;
        const blanoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        blancoCtx.fillStyle = `rgb(${pinkRGBA.r}, ${pinkRGBA.g}, ${pinkRGBA.b})`;
        for (let row = 0; row < DEFAULT_HEIGHT; row++) {
            for (let column = 0; column < DEFAULT_WIDTH; column++) {
                // 20% chance that there will be clutter on this pixel.
                if (Math.random() < 0.2) {
                    blancoCtx.fillRect(column, row, 1, 1);
                }
            }
        }
        let expected: Point[] = [];
        let result: Point[] = [];
        let isCorrect = true;
        for (let screenNum = 0; screenNum < 5; screenNum++) {
            const width = DEFAULT_WIDTH * percentage;
            const height = DEFAULT_HEIGHT * percentage;
            const localExpected = rotatePointsAroundCenter(
                [
                    new Point(width * 0.25, height * 0.25),
                    new Point(width * 0.25 + width, height * 0.25),
                    new Point(width * 0.25 + width, height * 0.25 + height),
                    new Point(width * 0.25, height * 0.25 + height),
                ],
                degree
            );
            const coloredCanvas = createRectangularScreensCanvas(
                localExpected,
                pinkRGBA,
                DEFAULT_WIDTH,
                DEFAULT_HEIGHT
            );
            const localResult = await findScreen(
                blanoCanvas,
                coloredCanvas,
                pinkRGBA
            );
            if (
                !isCorrectPoints(
                    localExpected,
                    localResult,
                    CORNER_OFFSET_THRESHOLD
                )
            ) {
                isCorrect = false;
                expected = localExpected;
                result = localResult;
                break;
            }
        }
        return { expected, result };
    },
};
