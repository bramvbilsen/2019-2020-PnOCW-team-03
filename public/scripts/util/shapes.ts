import Point from "../image_processing/screen_detection/Point";
import SlaveScreen from "./SlaveScreen";
import { BoundingBox, BoudingBoxOfSlaveScreens } from "./BoundingBox";
import { flattenOneLevel } from "./arrays";
import { IActualCorners } from "../types/Points";
const { checkIntersection } = require("line-intersect");

/**
 * Returns the centroid of the given points.
 * @param points A list of points.
 */
export function getCentroidOf(points: Point[]): Point {
    const sortedCorners = sortCorners(points);
    const intersection = checkIntersection(
        sortedCorners.LeftUp.x,
        sortedCorners.LeftUp.y,
        sortedCorners.RightUnder.x,
        sortedCorners.RightUnder.y,
        sortedCorners.LeftUnder.x,
        sortedCorners.LeftUnder.y,
        sortedCorners.RightUp.x,
        sortedCorners.RightUp.y
    );
    return new Point(intersection.point.x, intersection.point.y);
}

/**
 * Returns the bounding box of the given points.
 * @param points A list of points.
 */
export function calculateBoundingBox(
    points: Point[]
): {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
} {
    const xCoordinates = points.map((point) => point.x).sort((a, b) => a - b);
    const yCoordinates = points.map((point) => point.y).sort((a, b) => a - b);
    const minX = xCoordinates[0];
    const maxX = xCoordinates[xCoordinates.length - 1];
    const minY = yCoordinates[0];
    const maxY = yCoordinates[yCoordinates.length - 1];
    const res = sortCorners([
        new Point(minX, minY),
        new Point(maxX, maxY),
        new Point(maxX, minY),
        new Point(minX, maxY),
    ]);
    return {
        topLeft: res.LeftUp,
        topRight: res.RightUp,
        bottomLeft: res.LeftUnder,
        bottomRight: res.RightUnder,
    };
}

/**
 * Sorts the corners.
 * @param corners A list of points.
 */
export function sortCorners(
    corners: Point[]
): {
    LeftUp: Point;
    RightUp: Point;
    RightUnder: Point;
    LeftUnder: Point;
} {
    //sorteer
    corners = [...corners];
    corners.sort((a, b) => {
        const res = a.x - b.x;
        if (res === 0) {
            return a.y - b.y;
        }
        return res;
    });
    let LeftUp: Point;
    let RightUp: Point;
    let RightUnder: Point;
    let LeftUnder: Point;
    if (corners[0].y < corners[1].y) {
        LeftUp = corners[0];
        LeftUnder = corners[1];
    } else {
        LeftUp = corners[1];
        LeftUnder = corners[0];
    }
    if (corners[2].y < corners[3].y) {
        RightUp = corners[2];
        RightUnder = corners[3];
    } else {
        RightUp = corners[3];
        RightUnder = corners[2];
    }

    return {
        LeftUp,
        LeftUnder,
        RightUp,
        RightUnder,
    };
}

export function foundMostOuterScreensPoints(screens: SlaveScreen[]) {
    const boundingBox = new BoundingBox(
        flattenOneLevel(screens.map((screen) => screen.corners))
    );
    const center = boundingBox.centroid;
    const sC0 = screens[0].sortedCorners;
    const corners: {
        LeftUp: Point;
        RightUp: Point;
        RightUnder: Point;
        LeftUnder: Point;
    } = {
        LeftUp: sC0.LeftUp,
        RightUp: sC0.RightUp,
        RightUnder: sC0.RightUnder,
        LeftUnder: sC0.LeftUnder,
    };
    for (let i = 1; i < screens.length; i++) {
        const sC = screens[i].sortedCorners;
        if (center.distanceTo(sC.LeftUp) < center.distanceTo(corners.LeftUp)) {
            corners.LeftUp = sC.LeftUp;
        }
        if (
            center.distanceTo(sC.RightUp) < center.distanceTo(corners.RightUp)
        ) {
            corners.RightUp = sC.RightUp;
        }
        if (
            center.distanceTo(sC.RightUnder) <
            center.distanceTo(corners.RightUnder)
        ) {
            corners.RightUnder = sC.RightUnder;
        }
        if (
            center.distanceTo(sC.LeftUnder) <
            center.distanceTo(corners.LeftUnder)
        ) {
            corners.LeftUnder = sC.LeftUnder;
        }
    }
    return corners;
}
