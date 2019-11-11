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
                test().then(result => {
                    onNewResult(test.name, result);
                    resolve();
                });
            })
        );
    });
    return Promise.all(testCompletion);
}

const tests = [
    async function noScreenTest() {
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

    async function smallestAllowedScreenTest() {
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

    async function tenPercentScreenTest() {
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

    async function twentyPercentScreenTest() {
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

    async function thirtyPercentScreenTest() {
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

    async function tenPercent45DegRotatedScreenTest() {
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
            45
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
];
