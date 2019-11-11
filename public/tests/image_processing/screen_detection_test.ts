import findScreen, {
    createCanvas,
} from "../../scripts/image_processing/screen_detection/screen_detection";
import { IRGBAColor } from "../../scripts/types/Color";
import Point from "../../scripts/image_processing/screen_detection/Point";
import {
    Screen,
    correct,
    isCorrectPoints,
    createRectangularScreensCanvas,
    rotatePointsAroundCenter,
} from "./helpers";

const pinkRGBA: IRGBAColor = {
    r: 255,
    g: 70,
    b: 181,
    a: 100,
};

const CORNER_OFFSET_THRESHOLD = 50;

export default function run_tests(
    onNewResult: (testName: string, result: string) => void
) {
    const testCompletion: Array<Promise<void>> = [];
    tests.forEach(test => {
        testCompletion.push(
            new Promise((resolve, reject) => {
                const t0 = new Date();
                test().then(result => {
                    onNewResult(
                        test.name,
                        result + `\n⏳${+new Date() - +t0}ms`
                    );
                    resolve();
                });
            })
        );
    });
    return Promise.all(testCompletion);
}

/// THE ALGORITHM IS DESIGNED TO WORK WITH POSITIVE X AND Y VALUES ONLY!
const tests = [
    async function no_screen() {
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        const coloredCanvas = createCanvas(1280, 720);
        const coloredCtx = coloredCanvas.getContext("2d");
        coloredCtx.fillStyle = "rgb(255, 255, 255)";
        coloredCtx.fillRect(0, 0, 1280, 720);
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        const expected: Point[] = [];
        return correct(
            isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function smallest_allowed_screen() {
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        const expected = [
            new Point(0, 0),
            new Point(50, 0),
            new Point(50, 50),
            new Point(0, 50),
        ];
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            1280,
            720
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return correct(
            isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function ten_percent_screen() {
        const percentage = 0.1;
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        const expected = [
            new Point(0, 0),
            new Point(1280 * percentage, 0),
            new Point(1280 * percentage, 720 * percentage),
            new Point(0, 720 * percentage),
        ];
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            1280,
            720
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return correct(
            isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function twenty_percent_screen() {
        const percentage = 0.2;
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        const expected = [
            new Point(0, 0),
            new Point(1280 * percentage, 0),
            new Point(1280 * percentage, 720 * percentage),
            new Point(0, 720 * percentage),
        ];
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            1280,
            720
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return correct(
            isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function thirty_percent_screen() {
        const percentage = 0.3;
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        const expected = [
            new Point(0, 0),
            new Point(1280 * percentage, 0),
            new Point(1280 * percentage, 720 * percentage),
            new Point(0, 720 * percentage),
        ];
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            1280,
            720
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return correct(
            isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function ten_percent_45deg_rotated_screen() {
        const percentage = 0.1;
        const degree = 45;
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        const expected = rotatePointsAroundCenter(
            [
                new Point(0, 0),
                new Point(1280 * percentage, 0),
                new Point(1280 * percentage, 720 * percentage),
                new Point(0, 720 * percentage),
            ],
            degree
        );
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            1280,
            720
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return correct(
            isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function cluttered_blanco_random_rotation_and_size() {
        const percentage = Math.random();
        const degree = Math.random() * 360;
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        blancoCtx.fillStyle = `rgb(${pinkRGBA.r}, ${pinkRGBA.g}, ${pinkRGBA.b})`;
        for (let row = 0; row < 720; row++) {
            for (let column = 0; column < 1280; column++) {
                // 20% chance that there will be clutter on this pixel.
                if (Math.random() < 0.2) {
                    blancoCtx.fillRect(column, row, 1, 1);
                }
            }
        }
        const expected = rotatePointsAroundCenter(
            [
                new Point(0, 0),
                new Point(1280 * percentage, 0),
                new Point(1280 * percentage, 720 * percentage),
                new Point(0, 720 * percentage),
            ],
            degree
        );
        const coloredCanvas = createRectangularScreensCanvas(
            expected,
            pinkRGBA,
            1280,
            720
        );
        const result = await findScreen(blanoCanvas, coloredCanvas, pinkRGBA);
        return correct(
            !isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD),
            result.map(elem => JSON.stringify(elem)),
            expected.map(elem => JSON.stringify(elem))
        );
    },

    async function cluttered_blanco_random_rotation_and_size_5_screens() {
        const percentage = Math.random();
        const degree = Math.random() * 360;
        const blanoCanvas = createCanvas(1280, 720);
        const blancoCtx = blanoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, 1280, 720);
        blancoCtx.fillStyle = `rgb(${pinkRGBA.r}, ${pinkRGBA.g}, ${pinkRGBA.b})`;
        for (let row = 0; row < 720; row++) {
            for (let column = 0; column < 1280; column++) {
                // 20% chance that there will be clutter on this pixel.
                if (Math.random() < 0.2) {
                    blancoCtx.fillRect(column, row, 1, 1);
                }
            }
        }
        let failedExpected: Point[] = [];
        let failedResult: Point[] = [];
        let isCorrect = true;
        for (let screenNum = 0; screenNum < 5; screenNum++) {
            const expected = rotatePointsAroundCenter(
                [
                    new Point(0, 0),
                    new Point(1280 * percentage, 0),
                    new Point(1280 * percentage, 720 * percentage),
                    new Point(0, 720 * percentage),
                ],
                degree
            );
            const coloredCanvas = createRectangularScreensCanvas(
                expected,
                pinkRGBA,
                1280,
                720
            );
            const result = await findScreen(
                blanoCanvas,
                coloredCanvas,
                pinkRGBA
            );
            if (!isCorrectPoints(expected, result, CORNER_OFFSET_THRESHOLD)) {
                isCorrect = false;
                failedExpected = expected;
                failedResult = result;
                break;
            }
        }
        return correct(
            isCorrect,
            failedResult.map(elem => JSON.stringify(elem)),
            failedExpected.map(elem => JSON.stringify(elem))
        );
    },
];
