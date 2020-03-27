import Point from "../image_processing/screen_detection/Point";

/**
 * Converts radians to degrees.
 * @param radians Radians to convert.
 */
export function radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
}

/**
 * Converts degrees to radians.
 * @param degrees Degrees to convert.
 */
export function degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculates the new position of a point when rotated around another.
 * From: https://www.gamefromscratch.com/post/2012/11/24/GameDev-math-recipes-Rotating-one-point-around-another-point.aspx
 * @param pointToRotate The original position of the point.
 * @param anchorPoint The point around which should be rotated.
 * @param angle Angle in degrees.
 */
export function rotatePointAroundAnchor(
    pointToRotate: Point,
    anchorPoint: Point,
    angle: number
) {
    if (angle === 0) return pointToRotate.copy();
    angle = -angle;
    const rotatedX =
        Math.cos(degreesToRadians(angle)) * (pointToRotate.x - anchorPoint.x) -
        Math.sin(degreesToRadians(angle)) * (pointToRotate.y - anchorPoint.y) +
        anchorPoint.x;

    const rotatedY =
        Math.sin(degreesToRadians(angle)) * (pointToRotate.x - anchorPoint.x) +
        Math.cos(degreesToRadians(angle)) * (pointToRotate.y - anchorPoint.y) +
        anchorPoint.y;

    return new Point(rotatedX, rotatedY);
}
