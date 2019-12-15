import { createCanvas } from "../../scripts/image_processing/screen_detection/screen_detection";
import calculateScreenAngle from "../../scripts/image_processing/orientation_detection/orientation_detection_alternative";
import SlaveScreen from "../../scripts/util/SlaveScreen";
import Point from "../../scripts/image_processing/screen_detection/Point";
import { Orientation } from "../../scripts/image_processing/orientation_detection/orientations";
import test_runner, {
    TestResult,
    Tests
} from "./helpers";
import { IMasterVsActualPoint, CornerLabels } from "../../scripts/types/Points";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const topLeftColor = "rgb(255, 70, 180)";
const topRightColor = "rgb(0, 255, 25)";
const bottomLeftColor = "rgb(255, 216, 0)";
const bottomRightColor = "rgb(12, 0, 255)";

function checker(expected: { angle: number; RightUp: Point; RightUnder: Point; LeftUp: Point; LeftUnder: Point; }, result: { angle: number; RightUp: Point; RightUnder: Point; LeftUp: Point; LeftUnder: Point; }): boolean {
    if (expected.angle !== result.angle) {
        return false;
    }
    if (!expected.RightUp.equals(result.RightUp)) {
        return false;
    }
    if (!expected.RightUnder.equals(result.RightUnder)) {
        return false;
    }
    if (!expected.LeftUnder.equals(result.LeftUnder)) {
        return false;
    }
    if (!expected.LeftUp.equals(result.LeftUp)) {
        return false;
    }
    return true;
}

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
                checker(expected, result),
                dt
            );
        },
        onNewResult,
        testNames
    );
}

/// MAKE SURE THAT THE EXPECTED COORDINATES ARE INSIDE OF THE CANVAS!
const tests: Tests<{ angle: number; RightUp: Point; RightUnder: Point; LeftUp: Point; LeftUnder: Point; }> = {
    //     "No points": async function () {
    //         const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    //         const blancoCtx = blancoCanvas.getContext("2d");
    //         blancoCtx.fillStyle = "rgb(255, 255, 255)";
    //         blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    //         calculateScreenAngle(new SlaveScreen([], "1"), blancoCanvas);
    //         return { expected: Orientation.NONE, result: Orientation.NONE };
    //     },

    //     "Points but no colored screen": async function () {
    //         const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    //         const blancoCtx = blancoCanvas.getContext("2d");
    //         blancoCtx.fillStyle = "rgb(255, 255, 255)";
    //         blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    //         calculateScreenAngle(
    //             new SlaveScreen(
    //                 [
    //                     new Point(0, 0),
    //                     new Point(0, 50),
    //                     new Point(50, 0),
    //                     new Point(50, 50),
    //                 ],
    //                 "1"
    //             ),
    //             blancoCanvas
    //         );
    //         return { expected: Orientation.NONE, result: Orientation.NONE };
    //     },

    //     "CounterClockwise orientation": async function () {
    //         const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    //         const blancoCtx = blancoCanvas.getContext("2d");
    //         blancoCtx.fillStyle = "rgb(255, 255, 255)";
    //         blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    //         const orientationColorsCanvas = createCanvas(
    //             DEFAULT_WIDTH,
    //             DEFAULT_HEIGHT
    //         );
    //         const orientationColorsCtx = orientationColorsCanvas.getContext("2d");
    //         const points = [
    //             new Point(0, 0),
    //             new Point(0, 50),
    //             new Point(50, 0),
    //             new Point(50, 50),
    //         ];
    //         orientationColorsCtx.fillStyle = topRightColor;
    //         orientationColorsCtx.fillRect(
    //             points[0].x,
    //             points[0].y,
    //             points[3].x / 2,
    //             points[3].y / 2
    //         );
    //         orientationColorsCtx.fillStyle = topLeftColor;
    //         orientationColorsCtx.fillRect(
    //             points[1].x,
    //             points[1].y / 2,
    //             points[3].x / 2,
    //             points[3].y / 2
    //         );
    //         orientationColorsCtx.fillStyle = bottomRightColor;
    //         orientationColorsCtx.fillRect(
    //             points[3].x / 2,
    //             points[0].y,
    //             points[3].x / 2,
    //             points[3].y / 2
    //         );
    //         orientationColorsCtx.fillStyle = bottomLeftColor;
    //         orientationColorsCtx.fillRect(
    //             points[1].x / 2,
    //             points[1].y / 2,
    //             points[3].x / 2,
    //             points[3].y / 2
    //         );
    //         blancoCtx.drawImage(orientationColorsCanvas, points[0].x, points[0].y);

    //         const result = calculateScreenAngle(
    //             new SlaveScreen(
    //                 [
    //                     new Point(0, 0),
    //                     new Point(0, 50),
    //                     new Point(50, 0),
    //                     new Point(50, 50),
    //                 ],
    //                 "1"
    //             ),
    //             blancoCanvas
    //         );
    //         return { expected: Orientation.COUNTERCLOCKWISE, result };
    //     },

    "180deg orientation": async function () {
        const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blancoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const orientationColorsCanvas = createCanvas(
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const orientationColorsCtx = orientationColorsCanvas.getContext("2d");
        const LeftUp = new Point(50, 50);
        const RightUp = new Point(0, 50);
        const LeftUnder = new Point(50, 0);
        const RightUnder = new Point(0, 0);
        const width = 50;
        const height = 50;
        orientationColorsCtx.fillStyle = bottomRightColor;
        orientationColorsCtx.fillRect(
            RightUnder.x,
            RightUnder.y,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = topRightColor;
        orientationColorsCtx.fillRect(
            RightUp.x,
            RightUp.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = bottomLeftColor;
        orientationColorsCtx.fillRect(
            LeftUnder.x / 2,
            LeftUnder.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = topLeftColor;
        orientationColorsCtx.fillRect(
            LeftUp.x / 2,
            LeftUp.y / 2,
            width / 2,
            height / 2
        );
        blancoCtx.drawImage(orientationColorsCanvas, RightUnder.x, RightUnder.y);
        $("#test-results").append(blancoCanvas);

        const screen = new SlaveScreen(
            [
                new Point(0, 0),
                new Point(0, 50),
                new Point(50, 0),
                new Point(50, 50),
            ],
            "1"
        );
        const { angle, ...cornerMapping } = calculateScreenAngle(
            screen,
            blancoCanvas
        );

        screen.angle = angle;
        screen.actualCorners = cornerMapping;

        const a = screen.mapMasterToActualCornerLabel(CornerLabels.LeftUp);
        const b = screen.mapMasterToActualCornerLabel(CornerLabels.RightUp);
        const c = screen.mapMasterToActualCornerLabel(CornerLabels.RightUnder);
        const d = screen.mapMasterToActualCornerLabel(CornerLabels.LeftUnder);

        return {
            expected: {
                angle: 180,
                LeftUp,
                RightUp,
                LeftUnder,
                RightUnder
            }, result: {
                angle: angle,
                LeftUp: cornerMapping.LeftUp,
                RightUp: cornerMapping.RightUp,
                RightUnder: cornerMapping.RightUnder,
                LeftUnder: cornerMapping.LeftUnder
            }
        };
    },

    "0deg orientation": async function () {
        const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blancoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const orientationColorsCanvas = createCanvas(
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const orientationColorsCtx = orientationColorsCanvas.getContext("2d");
        const LeftUp = new Point(0, 0);
        const RightUp = new Point(50, 0);
        const LeftUnder = new Point(0, 50);
        const RightUnder = new Point(50, 50);
        const width = 50;
        const height = 50;
        orientationColorsCtx.fillStyle = bottomRightColor;
        orientationColorsCtx.fillRect(
            RightUnder.x / 2,
            RightUnder.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = topRightColor;
        orientationColorsCtx.fillRect(
            RightUp.x / 2,
            RightUp.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = bottomLeftColor;
        orientationColorsCtx.fillRect(
            LeftUnder.x,
            LeftUnder.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = topLeftColor;
        orientationColorsCtx.fillRect(
            LeftUp.x,
            LeftUp.y,
            width / 2,
            height / 2
        );
        blancoCtx.drawImage(orientationColorsCanvas, 0, 0);
        $("#test-results").append(blancoCanvas);

        const screen = new SlaveScreen(
            [
                new Point(0, 0),
                new Point(0, 50),
                new Point(50, 0),
                new Point(50, 50),
            ],
            "1"
        );
        const { angle, ...cornerMapping } = calculateScreenAngle(
            screen,
            blancoCanvas
        );

        screen.angle = angle;
        screen.actualCorners = cornerMapping;

        const a = screen.mapMasterToActualCornerLabel(CornerLabels.LeftUp);
        const b = screen.mapMasterToActualCornerLabel(CornerLabels.RightUp);
        const c = screen.mapMasterToActualCornerLabel(CornerLabels.RightUnder);
        const d = screen.mapMasterToActualCornerLabel(CornerLabels.LeftUnder);

        return {
            expected: {
                angle: 0,
                LeftUp,
                RightUp,
                LeftUnder,
                RightUnder
            }, result: {
                angle: angle,
                LeftUp: cornerMapping.LeftUp,
                RightUp: cornerMapping.RightUp,
                RightUnder: cornerMapping.RightUnder,
                LeftUnder: cornerMapping.LeftUnder
            }
        };
    },

    "90deg orientation": async function () {
        const blancoCanvas = createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const blancoCtx = blancoCanvas.getContext("2d");
        blancoCtx.fillStyle = "rgb(255, 255, 255)";
        blancoCtx.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const orientationColorsCanvas = createCanvas(
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
        const orientationColorsCtx = orientationColorsCanvas.getContext("2d");
        const LeftUp = new Point(50, 0);
        const RightUp = new Point(50, 50);
        const LeftUnder = new Point(0, 0);
        const RightUnder = new Point(0, 50);
        const width = 50;
        const height = 50;
        orientationColorsCtx.fillStyle = bottomRightColor;
        orientationColorsCtx.fillRect(
            RightUnder.x / 2,
            RightUnder.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = topRightColor;
        orientationColorsCtx.fillRect(
            RightUp.x / 2,
            RightUp.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = bottomLeftColor;
        orientationColorsCtx.fillRect(
            LeftUnder.x,
            LeftUnder.y / 2,
            width / 2,
            height / 2
        );
        orientationColorsCtx.fillStyle = topLeftColor;
        orientationColorsCtx.fillRect(
            LeftUp.x / 2,
            LeftUp.y,
            width / 2,
            height / 2
        );
        blancoCtx.drawImage(orientationColorsCanvas, 0, 0);
        $("#test-results").append(blancoCanvas);

        const screen = new SlaveScreen(
            [
                new Point(0, 0),
                new Point(0, 50),
                new Point(50, 0),
                new Point(50, 50),
            ],
            "1"
        );
        const { angle, ...cornerMapping } = calculateScreenAngle(
            screen,
            blancoCanvas
        );
        screen.angle = angle;
        screen.actualCorners = cornerMapping;

        const a = screen.mapMasterToActualCornerLabel(CornerLabels.LeftUp);
        const b = screen.mapMasterToActualCornerLabel(CornerLabels.RightUp);
        const c = screen.mapMasterToActualCornerLabel(CornerLabels.RightUnder);
        const d = screen.mapMasterToActualCornerLabel(CornerLabels.LeftUnder);

        return {
            expected: {
                angle: 90,
                LeftUp,
                RightUp,
                LeftUnder,
                RightUnder
            }, result: {
                angle: angle,
                LeftUp: cornerMapping.LeftUp,
                RightUp: cornerMapping.RightUp,
                RightUnder: cornerMapping.RightUnder,
                LeftUnder: cornerMapping.LeftUnder
            }
        };
    },
};
