import Point from "../image_processing/screen_detection/Point";

export function radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
}

export function degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

/**
 * From: https://www.gamefromscratch.com/post/2012/11/24/GameDev-math-recipes-Rotating-one-point-around-another-point.aspx
 * @param pointToRotate
 * @param anchorPoint
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
