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
import { rotatePointAroundAnchor } from "../../scripts/util/angles";
import { getCentroidOf } from "../../scripts/util/shapes";

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
    // "One screen, image has same aspect ratio as screen": async () => {
    //     const img = await loadImage(
    //         "http://localhost:3000/images/unicorn.jpeg"
    //     );
    //     const slaveScreen = new SlaveScreen(
    //         [
    //             new Point(0, 0),
    //             new Point(0, img.height),
    //             new Point(img.width, 0),
    //             new Point(img.width, img.height),
    //         ],
    //         "unicorn"
    //     );
    //     const canvas = createCanvas(img.width, img.height);
    //     const ctx = canvas.getContext("2d");
    //     ctx.drawImage(img, 0, 0);

    //     const resultCanvas = createImageCanvasForSlave(
    //         slaveScreen.boundingBox,
    //         slaveScreen,
    //         canvas
    //     );
    //     $("#test-results-visual").attr("src", resultCanvas.toDataURL());

    //     return { expected: 0, result: 0 };
    // },
    // "Two screens": async () => {
    //     const screenCorners: Array<[Point, Point, Point, Point]> = [
    //         [
    //             new Point(0, 0),
    //             new Point(0, 1000),
    //             new Point(1500, 0),
    //             new Point(1500, 1000),
    //         ],
    //         [
    //             new Point(2000, 2000),
    //             new Point(2000, 3000),
    //             new Point(3500, 2000),
    //             new Point(3500, 3000),
    //         ],
    //     ];
    //     const slaveScreens = createSlaveScreens(screenCorners);
    //     const globalBoundingBox = new BoundingBox(
    //         screenCorners.reduce((arr, curr) => {
    //             return arr.concat(curr);
    //         }, [])
    //     );
    //     const img = await loadImage(
    //         "http://localhost:3000/images/unicorn.jpeg"
    //     );
    //     const imgCanvas = createCanvas(img.width, img.height);
    //     const imgCtx = imgCanvas.getContext("2d");
    //     imgCtx.drawImage(img, 0, 0);

    //     const testResultCanvas = createCanvas(
    //         globalBoundingBox.width,
    //         globalBoundingBox.height
    //     );
    //     const testResultCtx = testResultCanvas.getContext("2d");
    //     testResultCtx.fillStyle = "black";
    //     testResultCtx.fillRect(
    //         0,
    //         0,
    //         testResultCanvas.width,
    //         testResultCanvas.height
    //     );
    //     slaveScreens.forEach((screen, index) => {
    //         const resultCanvas = createImageCanvasForSlave(
    //             globalBoundingBox,
    //             screen,
    //             imgCanvas
    //         );
    //         testResultCtx.drawImage(
    //             resultCanvas,
    //             screen.boundingBox.topLeft.x,
    //             screen.boundingBox.topLeft.y
    //         );
    //     });
    //     $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

    //     return { expected: 0, result: 0 };
    // },
    // "One screen rotated": async () => {
    //     // const x0 = 1266;
    //     // const y0 = 1012;
    //     // const width = 1500;
    //     // const height = 1000;
    //     // const x0 = 100;
    //     // const y0 = 100;
    //     // const width = 500;
    //     // const height = 500;
    //     // const rotation = 10;
    //     const x0 = 0;
    //     const y0 = 0;
    //     const width = 1300;
    //     const height = 1080;
    //     const rotation = 20;
    //     const corners = [
    //         new Point(x0, y0),
    //         new Point(x0 + width, y0),
    //         new Point(x0 + width, y0 + height),
    //         new Point(x0, y0 + height),
    //     ];

    //     const slaveScreen = new SlaveScreen(
    //         corners.map(corner =>
    //             rotatePointAroundAnchor(
    //                 corner,
    //                 getCentroidOf(corners),
    //                 rotation
    //             )
    //         ),
    //         "1"
    //     );
    //     slaveScreen.orientation = rotation;
    //     const globalBoundingBox = new BoundingBox(slaveScreen.corners);
    //     const img = await loadImage(
    //         "http://localhost:3000/images/unicorn.jpeg"
    //     );
    //     const imgCanvas = createCanvas(img.width, img.height);
    //     const imgCtx = imgCanvas.getContext("2d");
    //     imgCtx.drawImage(img, 0, 0);

    //     const testResultCanvas = createCanvas(
    //         globalBoundingBox.width,
    //         globalBoundingBox.height
    //     );
    //     const testResultCtx = testResultCanvas.getContext("2d");
    //     testResultCtx.fillStyle = "black";
    //     testResultCtx.fillRect(
    //         0,
    //         0,
    //         testResultCanvas.width,
    //         testResultCanvas.height
    //     );
    //     const resultCanvas = createImageCanvasForSlave(
    //         globalBoundingBox,
    //         slaveScreen,
    //         imgCanvas
    //     );
    //     testResultCtx.drawImage(
    //         resultCanvas,
    //         slaveScreen.boundingBox.topLeft.x,
    //         slaveScreen.boundingBox.topLeft.y
    //     );
    //     $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

    //     return { expected: 0, result: 0 };
    // },
    // "Two screens rotated": async () => {
    //     // const x0 = 1266;
    //     // const y0 = 1012;
    //     // const width = 1500;
    //     // const height = 1000;
    //     const x0 = 0;
    //     const y0 = 0;
    //     const width0 = 500;
    //     const height0 = 500;
    //     const rotation0 = 10;
    //     const corners0 = [
    //         new Point(x0, y0),
    //         new Point(x0 + width0, y0),
    //         new Point(x0 + width0, y0 + height0),
    //         new Point(x0, y0 + height0),
    //     ];
    //     const x1 = 500;
    //     const y1 = 20;
    //     const width1 = 1280;
    //     const height1 = 720;
    //     const rotation1 = 0;
    //     const corners1 = [
    //         new Point(x1, y1),
    //         new Point(x1 + width1, y1),
    //         new Point(x1 + width1, y1 + height1),
    //         new Point(x1, y1 + height1),
    //     ];

    //     const slaveScreen0 = new SlaveScreen(
    //         corners0.map(corner =>
    //             rotatePointAroundAnchor(
    //                 corner,
    //                 getCentroidOf(corners0),
    //                 rotation0
    //             )
    //         ),
    //         "0"
    //     );
    //     slaveScreen0.orientation = rotation0;

    //     const slaveScreen1 = new SlaveScreen(
    //         corners1.map(corner =>
    //             rotatePointAroundAnchor(
    //                 corner,
    //                 getCentroidOf(corners1),
    //                 rotation1
    //             )
    //         ),
    //         "1"
    //     );
    //     slaveScreen1.orientation = rotation1;

    //     const globalBoundingBox = new BoundingBox([
    //         ...slaveScreen0.corners,
    //         ...slaveScreen1.corners,
    //     ]);
    //     const img = await loadImage(
    //         "http://localhost:3000/images/unicorn.jpeg"
    //     );
    //     const imgCanvas = createCanvas(img.width, img.height);
    //     const imgCtx = imgCanvas.getContext("2d");
    //     imgCtx.drawImage(img, 0, 0);

    //     const testResultCanvas = createCanvas(
    //         globalBoundingBox.width,
    //         globalBoundingBox.height
    //     );
    //     const testResultCtx = testResultCanvas.getContext("2d");
    //     testResultCtx.fillStyle = "rgb(0,0,0)";
    //     testResultCtx.fillRect(
    //         0,
    //         0,
    //         testResultCanvas.width,
    //         testResultCanvas.height
    //     );
    //     const resultCanvas0 = createImageCanvasForSlave(
    //         globalBoundingBox,
    //         slaveScreen0,
    //         imgCanvas
    //     );
    //     const resultCanvas1 = createImageCanvasForSlave(
    //         globalBoundingBox,
    //         slaveScreen1,
    //         imgCanvas
    //     );

    //     testResultCtx.drawImage(
    //         resultCanvas0,
    //         slaveScreen0.boundingBox.topLeft.x,
    //         slaveScreen0.boundingBox.topLeft.y
    //     );
    //     testResultCtx.drawImage(
    //         resultCanvas1,
    //         slaveScreen1.boundingBox.topLeft.x,
    //         slaveScreen1.boundingBox.topLeft.y
    //     );
    //     $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

    //     return { expected: 0, result: 0 };
    // },

    "Two screens rotated": async () => {
        const x0 = 0;
        const y0 = 0;
        const width0 = 500;
        const height0 = 500;
        const rotation0 = 10;
        const corners0 = [
            new Point(x0, y0),
            new Point(x0 + width0, y0),
            new Point(x0 + width0, y0 + height0),
            new Point(x0, y0 + height0),
        ];
        const x1 = 500;
        const y1 = 20;
        const width1 = 1280;
        const height1 = 720;
        const rotation1 = 0;
        const corners1 = [
            new Point(x1, y1),
            new Point(x1 + width1, y1),
            new Point(x1 + width1, y1 + height1),
            new Point(x1, y1 + height1),
        ];
        const x2 = 800;
        const y2 = 900;
        const width2 = 1500;
        const height2 = 600;
        const rotation2 = 350;
        const corners2 = [
            new Point(x2, y2),
            new Point(x2 + width2, y2),
            new Point(x2 + width2, y2 + height2),
            new Point(x2, y2 + height2),
        ];

        const slaveScreen0 = new SlaveScreen(
            corners0.map(corner =>
                rotatePointAroundAnchor(
                    corner,
                    getCentroidOf(corners0),
                    rotation0
                )
            ),
            "0"
        );
        slaveScreen0.orientation = rotation0;

        const slaveScreen1 = new SlaveScreen(
            corners1.map(corner =>
                rotatePointAroundAnchor(
                    corner,
                    getCentroidOf(corners1),
                    rotation1
                )
            ),
            "1"
        );
        slaveScreen1.orientation = rotation1;

        const slaveScreen2 = new SlaveScreen(
            corners2.map(corner =>
                rotatePointAroundAnchor(
                    corner,
                    getCentroidOf(corners2),
                    rotation2
                )
            ),
            "2"
        );
        slaveScreen2.orientation = rotation2;

        const globalBoundingBox = new BoundingBox([
            ...slaveScreen0.corners,
            ...slaveScreen1.corners,
            ...slaveScreen2.corners,
        ]);
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
        testResultCtx.fillStyle = "rgb(0,0,0)";
        testResultCtx.fillRect(
            0,
            0,
            testResultCanvas.width,
            testResultCanvas.height
        );
        const resultCanvas0 = createImageCanvasForSlave(
            globalBoundingBox,
            slaveScreen0,
            imgCanvas
        );
        const resultCanvas1 = createImageCanvasForSlave(
            globalBoundingBox,
            slaveScreen1,
            imgCanvas
        );
        const resultCanvas2 = createImageCanvasForSlave(
            globalBoundingBox,
            slaveScreen2,
            imgCanvas
        );

        testResultCtx.drawImage(
            resultCanvas0,
            slaveScreen0.boundingBox.topLeft.x,
            slaveScreen0.boundingBox.topLeft.y
        );
        testResultCtx.drawImage(
            resultCanvas1,
            slaveScreen1.boundingBox.topLeft.x,
            slaveScreen1.boundingBox.topLeft.y
        );
        testResultCtx.drawImage(
            resultCanvas2,
            slaveScreen2.boundingBox.topLeft.x,
            slaveScreen2.boundingBox.topLeft.y
        );
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
