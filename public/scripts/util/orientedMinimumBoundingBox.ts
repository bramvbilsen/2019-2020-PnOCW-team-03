import Point from "../image_processing/screen_detection/Point";
import convexHull, {
    convexHullCentroid,
} from "../image_processing/screen_detection/hull";

// https://geidav.wordpress.com/2014/01/23/computing-oriented-minimum-bounding-boxes-in-2d/
// https://gis.stackexchange.com/questions/22895/finding-minimum-area-rectangle-for-given-points

/**
 * Calculates oriented minimum bounding box for the given points.
 * @param points List of points that combine to a convex polygon (order does not matter).
 * @returns Points of oriented minimum bounding box in in counter-clockwise order.
 */
export default function orientedMinimumBoundingBox(points: Point[]) {
    const ch = convexHull(points);

    let smallestArea = Infinity;
    let smallestSurroundingRectangle;

    // Loop over edges of convex hull and find oriented minimum bounding box
    for (let i = 0; i < ch.length; i++) {
        // Edge to work with this loop.
        let edge = { a: ch[i], b: i + 1 >= ch.length ? ch[0] : ch[i + 1] };

        // Angle calculations:
        //  * Translate one of the endpoints to the origin, translate the other accordingly.
        //  * Calculate angle with x-axis.
        //  * Normalize angle.
        let angleTranslationX, angleTranslationY;
        if (edge.a.x > 0) angleTranslationX = -edge.a.x;
        else angleTranslationX = edge.a.x;
        if (edge.a.y > 0) angleTranslationY = -edge.a.y;
        else angleTranslationY = edge.a.y;
        let angle = Math.atan2(
            edge.b.y + angleTranslationY,
            edge.b.x + angleTranslationX
        );
        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        // Calculate center of convex hull.
        //  !! This function expects counter-clockwise sort,
        //      by default, the point of our hull are sorted clockwise, thus inverse!
        const hullCentroid = convexHullCentroid(ch.reverse());

        // Rotate the convex hull so that the current edge to work with is parallel
        //  to the x-axis.
        const rotatedHull = ch.map(point =>
            rotatePointAroundAnchor(point, hullCentroid, -angle)
        );

        // Calculate axis-aligned bounding box and some of its properties...
        const axisAlignedBoundingBox = calculateAxisAlignedBoundingBox(
            rotatedHull
        );
        const aabb_width =
            Math.max(...axisAlignedBoundingBox.map(point => point.x)) -
            Math.min(...axisAlignedBoundingBox.map(point => point.x));
        const aabb_height =
            Math.max(...axisAlignedBoundingBox.map(point => point.y)) -
            Math.min(...axisAlignedBoundingBox.map(point => point.y));
        const area = aabb_width * aabb_height;

        // If a smaller box is founded, save it.
        if (area < smallestArea) {
            smallestArea = area;
            smallestSurroundingRectangle = axisAlignedBoundingBox.map(point =>
                rotatePointAroundAnchor(point, hullCentroid, angle)
            );
        }
    }

    return smallestSurroundingRectangle;
}

/**
 * @returns The axis aligned bounding box with the points sorted
 *  counter-clockwise.
 */
function calculateAxisAlignedBoundingBox(points: Point[]) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
    }
    return [
        new Point(minX, minY),
        new Point(minX, maxY),
        new Point(maxX, maxY),
        new Point(maxX, minY),
    ];
}

function rotatePointAroundAnchor(point: Point, anchor: Point, angle: number) {
    const xTranslated = point.x - anchor.x;
    const yTranslated = point.y - anchor.y;
    const xRotatedAfterTranslation =
        xTranslated * Math.cos(angle) - yTranslated * Math.sin(angle);
    const yRotatedAfterTranslation =
        yTranslated * Math.cos(angle) + xTranslated * Math.sin(angle);
    const rotatedWithoutTranslation = new Point(
        xRotatedAfterTranslation + anchor.x,
        yRotatedAfterTranslation + anchor.y
    );
    return rotatedWithoutTranslation;
}
