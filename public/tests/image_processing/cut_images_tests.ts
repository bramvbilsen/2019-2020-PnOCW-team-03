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
import Line from "../../scripts/image_processing/screen_detection/Line";

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
    // "One screen - image has same aspect ratio as screen": async () => {
    //     //@ts-ignore
    //     console.log(window.transform);
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
    //     slaveScreen.orientation = 0;
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
    //     const slaveScreens = createSlaveScreens(screenCorners, [0, 0]);
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
    //     const x0 = 50;
    //     const y0 = 0;
    //     const width0 = 500;
    //     const height0 = 400;
    //     const rotation0 = 0;
    //     const corners0 = [
    //         new Point(x0, y0),
    //         new Point(x0 + width0, y0),
    //         new Point(x0 + width0, y0 + height0),
    //         new Point(x0, y0 + height0),
    //     ];
    //     const x1 = 200;
    //     const y1 = 150;
    //     const width1 = 1280;
    //     const height1 = 720;
    //     const rotation1 = 20;
    //     const corners1 = [
    //         new Point(x1, y1),
    //         new Point(x1 + width1, y1),
    //         new Point(x1 + width1, y1 + height1),
    //         new Point(x1, y1 + height1),
    //     ];

    //     const slaveScreen0 = new SlaveScreen(
    //         corners0.map(corner => {
    //             return rotatePointAroundAnchor(
    //                 corner,
    //                 getCentroidOf(corners0),
    //                 rotation0
    //             )
    //         }
    //         ),
    //         "0"
    //     );
    //     console.log("Rotation 0: " + rotation0);

    //     const slaveScreen1 = new SlaveScreen(
    //         corners1.map(corner => {
    //             return rotatePointAroundAnchor(
    //                 corner,
    //                 getCentroidOf(corners1),
    //                 rotation1
    //             )
    //         }
    //         ),
    //         "1"
    //     );
    //     console.log("Rotation 1: " + rotation1);

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

    //     const testResultCanvas = createCanvasWithResults([[slaveScreen0, resultCanvas0], [slaveScreen1, resultCanvas1]], globalBoundingBox.width, globalBoundingBox.height)

    //     $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

    //     return { expected: 0, result: 0 };
    // },
    "Perspective rotated": async () => {
        const x0 = 50;
        const y0 = 0;
        const width0 = 500;
        const height0 = 400;
        const rotation0 = 0;
        const corners0 = [
            new Point(x0, y0 + 150),
            new Point(x0 + width0, y0),
            new Point(x0 + width0, y0 + height0 - 50),
            new Point(x0, y0 + height0),
        ];

        const slaveScreen0 = new SlaveScreen(
            corners0.map(corner => {
                return rotatePointAroundAnchor(
                    corner,
                    getCentroidOf(corners0),
                    rotation0
                )
            }
            ),
            "0"
        );
        slaveScreen0.widthEdge = new Line(new Point(x0 + 50, y0), new Point(x0 + width0, y0));

        const globalBoundingBox = new BoundingBox([
            ...slaveScreen0.corners,
        ]);
        const img = await loadImage(
            "http://localhost:3000/images/unicorn.jpeg"
        );
        const imgCanvas = createCanvas(img.width, img.height);
        const imgCtx = imgCanvas.getContext("2d");
        imgCtx.drawImage(img, 0, 0);


        const resultCanvas0 = createImageCanvasForSlave(
            globalBoundingBox,
            slaveScreen0,
            imgCanvas
        );

        const testResultCanvas = createCanvasWithResults([[slaveScreen0, resultCanvas0]], globalBoundingBox.width, globalBoundingBox.height)

        $("#test-results-visual").attr("src", testResultCanvas.toDataURL());

        return { expected: 0, result: 0 };
    },
};

function createCanvasWithResults(results: Array<[SlaveScreen, HTMLCanvasElement]>, width: number, height: number) {
    const canvas = createCanvas(
        width,
        height
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    results.forEach((result) => {
        const screen = result[0];
        const resCanvas = result[1];
        const screenCenter = screen.centroid;
        ctx.translate(screenCenter.x, screenCenter.y);
        ctx.rotate(-screen.angle);
        ctx.translate(-(screenCenter.x), -(screenCenter.y));
        ctx.drawImage(
            resCanvas,
            screen.sortedCorners.LeftUp.x,
            screen.sortedCorners.LeftUp.y
        );
        ctx.resetTransform();
    });

    return canvas;
}
