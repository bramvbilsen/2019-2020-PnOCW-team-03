import SlaveScreen from "../../scripts/util/SlaveScreen";
import Point from "../../scripts/image_processing/screen_detection/Point";
import test_runner, { numberCompare, TestResult, Tests } from "./helpers";
import { rotatePointAroundAnchor } from "../../scripts/util/angles";
import { getCentroidOf } from "../../scripts/util/shapes";
import { Orientation } from "../../scripts/image_processing/orientation_detection/orientations";
import { labelCorners } from "../../scripts/image_processing/orientation_detection/orientation_detection_alternative";
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
                numberCompare(expected, result, 5),
                dt
            );
        },
        onNewResult,
        testNames
    );
}

const tests: Tests<number> = {
    "No rotation": async function () {
        const corners = [
            new Point(0, 0),
            new Point(100, 0),
            new Point(100, 50),
            new Point(0, 50),

        ]
        const screen = new SlaveScreen(corners, "1");
        console.log(screen.widthEdge);
        const angle = screen.angle;


        return { expected: 0, result: angle };
    },
    "90deg rotation": async function () {

        const nonRotatedPoints = [
            new Point(500, 200),
            new Point(800, 200),
            new Point(800, 400),
            new Point(500, 400),

        ];
        const corners: Point[] = nonRotatedPoints.map(point => {
            return rotatePointAroundAnchor(point, getCentroidOf(nonRotatedPoints), 90);
        });

        let labeled = labelCorners(corners[0], corners[1], corners[2], corners[3]);
        const screen = new SlaveScreen(corners, "1");
        const angle = screen.angle;


        return { expected: 90, result: angle };
    },
    "45deg rotation": async function () {
        const nonRotatedPoints = [
            new Point(500, 200),
            new Point(800, 200),
            new Point(800, 400),
            new Point(500, 400),
        ];
        const corners: Point[] = nonRotatedPoints.map(point => {
            return rotatePointAroundAnchor(point, getCentroidOf(nonRotatedPoints), 45);
        });

        let labeled = labelCorners(corners[0], corners[1], corners[2], corners[3]);
        const screen = new SlaveScreen(corners, "1");
        const angle = screen.angle;

        return { expected: 45, result: angle };
    },
    "135deg rotation": async function () {
        const nonRotatedPoints = [
            new Point(500, 200),
            new Point(800, 200),
            new Point(800, 400),
            new Point(500, 400),
        ];
        const corners: Point[] = nonRotatedPoints.map(point => {
            return rotatePointAroundAnchor(point, getCentroidOf(nonRotatedPoints), 135);
        });


        let labeled = labelCorners(corners[0], corners[1], corners[2], corners[3]);
        const screen = new SlaveScreen(corners, "1");
        const angle = screen.angle;

        return { expected: 135, result: angle };
    },
    "179deg rotation": async function () {
        const nonRotatedPoints = [
            new Point(500, 200),
            new Point(800, 200),
            new Point(800, 400),
            new Point(500, 400),
        ];
        const corners: Point[] = nonRotatedPoints.map(point => {
            return rotatePointAroundAnchor(point, getCentroidOf(nonRotatedPoints), 179);
        });

        const screen = new SlaveScreen(corners, "1");
        let labeled = labelCorners(corners[0], corners[1], corners[2], corners[3]);
        const angle = screen.angle;

        return { expected: 179, result: angle };
    },
    "Random rotation": async function () {
        const r = Math.random();
        const nonRotatedPoints = [
            new Point(500, 200),
            new Point(800, 200),
            new Point(800, 400),
            new Point(500, 400)
        ];
        const corners: Point[] = nonRotatedPoints.map(point => {
            return rotatePointAroundAnchor(point, getCentroidOf(nonRotatedPoints), r * 180);
        });

        const screen = new SlaveScreen(corners, "1");
        const angle = screen.angle;

        return { expected: r * 180, result: angle };
    }
};
