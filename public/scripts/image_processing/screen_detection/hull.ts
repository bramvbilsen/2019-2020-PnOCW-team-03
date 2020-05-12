import Point from "./Point";

/**
 *
 * @param points
 * @returns Convex hull for `Points` sorted clockwise.
 */
/**
 * Computes the convex hull of the given points after they are sorted clockwise.
 * All computations are being done with a new list containing copies of the points.
 * @param points A list of points.
 */
export default function convexHull(points: Point[]) {
    points = points.map((point) => point.copy());

    //find point with smallets y-coordinate
    const minIndex = findSmallestY(points);
    //Swap
    const swappedPoints = swap(points, 0, minIndex);
    //remove the first element, which is used as reference in the algorithm
    const p0 = swappedPoints.shift();
    //sort the Points based on their Polar angle with p0
    const sortedPoints = swappedPoints.sort((p1, p2) => compare(p0, p1, p2));
    //Remove points with the same polar Angle, only the point located
    //farthest from p0 remains int the list
    const filtered = filterOnAngle(p0, sortedPoints);
    //if the filtered array contains less then 3 points, there is no convex hull
    if (filtered.length < 3) return [];
    //create a stack and push first three points to it
    const stack = [];
    stack.push(p0, filtered[0], filtered[1]);
    for (let i = 2; i < filtered.length; i++) {
        // Keep removing top while the angle formed by
        // points next-to-top, top, and points[i] makes
        // a non-left turn
        while (
            orientation(
                stack[stack.length - 2],
                stack[stack.length - 1],
                filtered[i]
            ) !== 2
        ) {
            stack.splice(stack.length - 1, 1);
        }
        stack.push(filtered[i]);
    }
    return stack;
}

// http://paulbourke.net/geometry/polygonmesh/centroid.pdf
/**
 * Calculates convex hull of points and returns its centroid (a Point).
 * @param points A list of points.
 */
export function convexHullCentroid(points: Point[]) {
    points = convexHull(points);

    let x = 0;
    let y = 0;

    for (let i = 0; i < points.length; i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xii = i + 1 >= points.length ? points[0].x : points[i + 1].x;
        const yii = i + 1 >= points.length ? points[0].y : points[i + 1].y;

        x += (xi + xii) * (xi * yii - xii * yi);
        y += (yi + yii) * (xi * yii - xii * yi);
    }

    let area = convexHullArea(points); //Fixme The convex hull is computed 2 times.
    x = x / (6 * area);
    y = y / (6 * area);

    return new Point(x, y);
}

// http://paulbourke.net/geometry/polygonmesh/centroid.pdf
/**
 * Calculates the convex hull and returns its area.
 * @param points A list of points.
 */
export function convexHullArea(points: Point[]) {
    points = convexHull(points);
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xii = i + 1 >= points.length ? points[0].x : points[i + 1].x;
        const yii = i + 1 >= points.length ? points[0].y : points[i + 1].y;
        area += xi * yii - xii * yi;
    }
    area = area / 2;
    return area;
}

/**
 * Returns the index of the point with the smalles y-value.
 * If the list is empty the index will be 0.
 * @param points A list of points.
 */
function findSmallestY(points: Point[]) {
    let minimumY = Number.POSITIVE_INFINITY;
    let minIndex = 0;
    for (let i = 0; i < points.length; i++) {
        if (points[i].y < minimumY) {
            minimumY = points[i].y;
            minIndex = i;
        }
        if (points[i].y === minimumY) {
            if (points[i].x < points[minIndex].x) {
                minIndex = i;
            }
        }
    }
    return minIndex;
}

/**
 * Returns the orientation between the three points.
 * @returns 0 (colinear), 1 (clockwise) or 2 (counterclockwise)
 * @param p A first point.
 * @param q A second point.
 * @param r A third point.
 */
export function orientation(p: Point, q: Point, r: Point) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) {
        return 0;
    } // colinear
    if (val > 0) {
        return 1;
    } // clockwise
    else {
        return 2;
    } // counterclockwise
}

/**
 * Compares the three points.
 * @returns -1 or 1
 * @param p0 A first point.
 * @param p1 A second point.
 * @param p2 A third point.
 */
function compare(p0: Point, p1: Point, p2: Point) {
    // Find orientation
    const o = orientation(p0, p1, p2);
    if (o === 0) return p0.distanceTo(p2) >= p0.distanceTo(p1) ? -1 : 1;
    return o === 2 ? -1 : 1;
}

/**
 * Swaps two points with each other.
 * @param points A list of points.
 * @param i Index of the first point.
 * @param j Index of the second point.
 */
function swap(points: Point[], i: number, j: number) {
    const temp = points[i];
    points[i] = points[j];
    points[j] = temp;
    return points;
}

/**
 * Removes colinear points.
 * @param p0 The starting point.
 * @param points A list of points.
 */
export function filterOnAngle(p0: Point, points: Point[]) {
    const toRemove = [];
    for (let i = 0; i < points.length - 1; i++) {
        if (orientation(p0, points[i], points[i + 1]) === 0) {
            toRemove.push(i);
        }
    }
    while (toRemove.length) {
        points.splice(toRemove.pop(), 1);
    }
    return points;
}
