import SlaveScreen from "../../util/SlaveScreen";
import Point from "../screen_detection/Point";

function getAngle(p1: Point, p2: Point, p3: Point, p4: Point) {
    var labeledCorners = cornerLabeling(p1, p2, p3, p4);
    var left = labeledCorners["LeftUp"];
    var right = labeledCorners["RightUp"];
    var origin = left;
    var vector1 = new Point(right.x - origin.x, left.y - origin.y);
    var vector2 = new Point(right.x - origin.x, right.y - origin.y);
    var radians =
        Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);
    return radians * (180 / Math.PI);
}

function cornerLabeling(p1: Point, p2: Point, p3: Point, p4: Point) {
    var corners = [p1, p2, p3, p4];
    var sums = [];
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    var rightUnderIndex, leftUpperIndex;
    var rightUpperCoordinate: Point,
        leftUnderCoordinate: Point,
        leftUpperCoordinate: Point,
        rightUnderCoordinate: Point;

    sums[0] = p1.x + p1.y;
    sums[1] = p2.x + p2.y;
    sums[2] = p3.x + p3.y;
    sums[3] = p4.x + p4.y;

    /* 1) LEFT-UPPER & RIGHT-UNDER */
    for (var i = 0; i < sums.length; i++) {
        if (sums[i] >= max) {
            max = sums[i];
            rightUnderIndex = i;
            rightUnderCoordinate = corners[i];
        }
        if (sums[i] <= min) {
            min = sums[i];
            leftUpperIndex = i;
            leftUpperCoordinate = corners[i];
        }
    }
    // Remove those two
    corners.splice(rightUnderIndex, 1);
    corners.splice(leftUpperIndex, 1);

    /* 2) REST */
    if (corners[0].x - corners[1].x >= 0 && corners[0].y - corners[1].y <= 0) {
        rightUpperCoordinate = corners[0];
        leftUnderCoordinate = corners[1];
    } else {
        rightUpperCoordinate = corners[1];
        leftUnderCoordinate = corners[0];
    }

    return {
        LeftUp: leftUpperCoordinate,
        RightUp: rightUpperCoordinate,
        RightUnder: rightUnderCoordinate,
        LeftUnder: leftUnderCoordinate,
    };
}

export default function getOrientationAngle(
    screen: SlaveScreen,
    canvas: HTMLCanvasElement
): number {
    if (screen.corners.length === 0) {
        return 0;
    }
    const points = screen.corners;
    const angle = getAngle(points[0], points[1], points[2], points[3]);
    // const orientation = getOrientation(centroids, canvas);
    // console.log(orientation);
    // switch (orientation) {
    //     case Orientation.NORMAL:
    //         if (angle === 0) {
    //             return 0;
    //         }
    //         return angle > 0 ? angle : 360 + angle;
    //     case Orientation.CLOCKWISE:
    //         return 90 + angle;
    //     case Orientation.FLIPPED:
    //         return 180 + angle;
    //     case Orientation.COUNTERCLOCKWISE:
    //         return 270 + angle;
    // }
}
