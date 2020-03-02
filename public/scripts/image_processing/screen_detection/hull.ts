import Point from "./Point";

/**
 *
 * @param points
 * @returns Convex hull for `Points` sorted clockwise.
 */
export default function convexHull(points: Point[]) {
    points = points.map(point => point.copy());

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
 * Calculates convex hull of points and returns its centroid.
 * @param points
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

    let area = convexHullArea(points);
    x = x / (6 * area);
    y = y / (6 * area);

    return new Point(x, y);
}

// http://paulbourke.net/geometry/polygonmesh/centroid.pdf
/**
 * Calculates convex hull of points and returns its area.
 * @param points
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

function findSmallestY(Points: Point[]) {
    let minimumY = Number.POSITIVE_INFINITY;
    let minIndex = 0;
    for (let i = 0; i < Points.length; i++) {
        if (Points[i].y < minimumY) {
            minimumY = Points[i].y;
            minIndex = i;
        }
        if (Points[i].y === minimumY) {
            if (Points[i].x < Points[minIndex].x) {
                minIndex = i;
            }
        }
    }
    return minIndex;
}

function orientation(p: Point, q: Point, r: Point) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) {
        return 0;
    } // colinear
    if (val > 0) {
        return 1;
    } else {
        return 2;
    } // clock or counterclock wise
}

function compare(p0: Point, p1: Point, p2: Point) {
    // Find orientation
    const o = orientation(p0, p1, p2);
    if (o === 0) return p0.distanceTo(p2) >= p0.distanceTo(p1) ? -1 : 1;
    return o === 2 ? -1 : 1;
}

function swap(Points: Point[], i: number, j: number) {
    const temp = Points[i];
    Points[i] = Points[j];
    Points[j] = temp;
    return Points;
}

function filterOnAngle(p0: Point, Points: Point[]) {
    const toRemove = [];
    for (let i = 0; i < Points.length - 1; i++) {
        if (orientation(p0, Points[i], Points[i + 1]) === 0) {
            toRemove.push(i);
        }
    }
    while (toRemove.length) {
        Points.splice(toRemove.pop(), 1);
    }
    return Points;
}
