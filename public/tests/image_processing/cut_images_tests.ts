import { createCanvas } from "../../scripts/image_processing/screen_detection/screen_detection";
import test_runner, {
    TestResult,
    Tests,
    rotatePointsAroundCenter,
} from "./helpers";
import { loadImage } from "../../scripts/util/images";
import {
    PREFERRED_CANVAS_WIDTH,
    PREFERRED_CANVAS_HEIGHT,
} from "../../scripts/CONSTANTS";
import { createImageCanvasForSlave } from "../../scripts/util/ImageCutHandler";
import SlaveScreen from "../../scripts/util/SlaveScreen";
import Point from "../../scripts/image_processing/screen_detection/Point";
import { BoundingBox } from "../../scripts/util/BoundingBox";

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
    "One screen, image has same aspect ratio as screen": async () => {
        const img = await loadImage(
            "http://localhost:3000/images/unicorn.jpeg"
        );
        const slaveScreen = new SlaveScreen(
            [
                new Point(0, 0),
                new Point(0, img.height),
                new Point(img.width, 0),
                new Point(img.width, img.height),
            ],
            "unicorn"
        );
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const resultCanvas = createImageCanvasForSlave(
            slaveScreen.boundingBox,
            slaveScreen.boundingBox,
            canvas
        );
        $("#test-results-visual").attr("src", resultCanvas.toDataURL());

        return { expected: 0, result: 0 };
    },
    "Two screens": async () => {
        const screenCorners: Array<[Point, Point, Point, Point]> = [
            [
                new Point(0, 0),
                new Point(0, 1000),
                new Point(1500, 0),
                new Point(1500, 1000),
            ],
            [
                new Point(2000, 2000),
                new Point(2000, 3000),
                new Point(3500, 2000),
                new Point(3500, 3000),
            ],
        ];
        const slaveScreens = createSlaveScreens(screenCorners);
        const globalBoundingBox = new BoundingBox(
            screenCorners.reduce((arr, curr) => {
                return arr.concat(curr);
            }, [])
        );
        const img = await loadImage(
            "http://localhost:3000/images/unicorn.jpeg"
        );
        const imgCanvas = createCanvas(img.width, img.height);
        const imgCtx = imgCanvas.getContext("2d");
        imgCtx.drawImage(img, 0, 0);

        const testResultCanvas = createCanvas(
            globalBoundingBox.width,
            globalBoundingBox.height
        );
        const testResultCtx = testResultCanvas.getContext("2d");
        testResultCtx.fillStyle = "black";
        testResultCtx.fillRect(
            0,
            0,
            testResultCanvas.width,
            testResultCanvas.height
        );
        slaveScreens.forEach((screen, index) => {
            const resultCanvas = createImageCanvasForSlave(
                globalBoundingBox,
                screen.boundingBox,
                imgCanvas
            );
            testResultCtx.drawImage(
                resultCanvas,
                screen.boundingBox.topLeft.x,
                screen.boundingBox.topLeft.y
            );
        });
        $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

        return { expected: 0, result: 0 };
    },
    "Two screens rotated": async () => {
        const screenCorners: Array<Point[]> = [
            rotatePointsAroundCenter(
                [
                    new Point(245, 490),
                    new Point(245, 490 + 1000),
                    new Point(245 + 1500, 490),
                    new Point(245 + 1500, 490 + 1000),
                ],
                45
            ),
            rotatePointsAroundCenter(
                [
                    new Point(1870, 1850),
                    new Point(1870, 1850 + 600),
                    new Point(1870 + 700, 1850),
                    new Point(1870 + 700, 1850 + 600),
                ],
                25
            ),
        ];
        const slaveScreens = createSlaveScreens(screenCorners);
        slaveScreens[0].orientation = 45;
        slaveScreens[1].orientation = 25;
        const globalBoundingBox = new BoundingBox(
            screenCorners.reduce((arr, curr) => {
                return arr.concat(curr);
            }, [])
        );
        const img = await loadImage(
            "http://localhost:3000/images/unicorn.jpeg"
        );
        const imgCanvas = createCanvas(img.width, img.height);
        const imgCtx = imgCanvas.getContext("2d");
        imgCtx.drawImage(img, 0, 0);

        const testResultCanvas = createCanvas(
            globalBoundingBox.width,
            globalBoundingBox.height
        );
        const testResultCtx = testResultCanvas.getContext("2d");
        testResultCtx.fillStyle = "black";
        testResultCtx.fillRect(
            0,
            0,
            testResultCanvas.width,
            testResultCanvas.height
        );
        slaveScreens.forEach((screen, index) => {
            const resultCanvas = createImageCanvasForSlave(
                globalBoundingBox,
                screen.boundingBox,
                imgCanvas
            );
            testResultCtx.drawImage(
                resultCanvas,
                screen.boundingBox.topLeft.x,
                screen.boundingBox.topLeft.y
            );
        });
        $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

        return { expected: 0, result: 0 };
    },
};

function createSlaveScreens(screensCorners: Array<Point[]>): SlaveScreen[] {
    const screens: SlaveScreen[] = [];
    screensCorners.forEach(screenCorners => {
        screens.push(
            new SlaveScreen(
                screenCorners,
                ((Math.random() * 10000) % 1000).toString()
            )
        );
    });
    return screens;
}
