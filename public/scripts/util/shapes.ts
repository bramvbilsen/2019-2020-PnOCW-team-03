import Point from "../image_processing/screen_detection/Point";

/**
 * Returns the centroid of the given points.
 * @param points A list of points.
 */
export function getCentroidOf(points: Point[]): Point {
    var sumX = 0;
    var sumY = 0;
    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
    });
    return new Point(
        Math.round(sumX / points.length),
        Math.round(sumY / points.length)
    );
}

/**
 * Returns the bounding box of the given points.
 * @param points A list of points.
 */
export function calculateBoundingBox(points: Point[]): { 
    topLeft: Point; topRight: Point; bottomLeft: Point; bottomRight: Point } {
    const xCoordinates = points.map(point => point.x).sort((a, b) => a - b);
    const yCoordinates = points.map(point => point.y).sort((a, b) => a - b);
    const minX = xCoordinates[0];
    const maxX = xCoordinates[xCoordinates.length - 1];
    const minY = yCoordinates[0];
    const maxY = yCoordinates[yCoordinates.length - 1];
    const res = sortCorners([new Point(minX, minY), new Point(maxX, maxY), new Point(maxX, minY), new Point(minX, maxY)]);
    return {
        topLeft: res.LeftUp,
        topRight: res.RightUp,
        bottomLeft: res.LeftUnder,
        bottomRight: res.RightUnder,
    }
}

/**
 * Sorts the corners.
 * @param corners A list of points.
 */
export function sortCorners(corners: Point[]): {
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