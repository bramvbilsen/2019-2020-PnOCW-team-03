import Point from "../screen_detection/Point";
import SlaveScreen from "../../util/SlaveScreen";
import {BoundingBox} from '../../util/BoundingBox';

/**
	 * Calculates the coordinates of the closest surrounding box around the screens.
	 * @param {array} list - A list with the points of the screens.
	 */
export function getSurroundingBoxPoints(list: Array<Point>) {
    let highestX: number = 0;
    let lowestX: number = 0;
    let highestY: number = 0;
    let lowestY: number = 0;

    list.forEach(point => {
        if (point.x > highestX) highestX = point.x;
        if (point.x < lowestX) lowestX = point.x;
        if (point.y > highestY) highestY = point.y;
        if (point.y < lowestY) lowestY = point.y;
    });

    return [new Point(lowestX,lowestY), new Point(highestX,highestY)];
}

/**
	 * Translates the points of the screens to just fit the surrounding box.
     * Returns the width, height and the list with the translated points.
     * @param {number} lowestX - The lowest x-value.
     * @param {number} lowestY - The lowest Y-value
	 * @param {array} list - A list with the points of the screens.
	 */
export function getPointsTranslatedToBox(lowestX: number, lowestY: number, list: Array<Point>) {
    for (let i = 0; i < list.length; i++) {
        const point: Point = list[i];
        list[i] = new Point(point.x-lowestX, point.y-lowestY);
    }

    return list;
}

/**
	 * Translates the points of the boxed screens to find their coordinates on the image to project.
     * Returns the list with the translated points.
     * @param {number} width - The width of the image to cast.
     * @param {number} height - The height of the image to cast.
     * @param {number} screenWidth - The width of the image with the screens.
     * @param {number} screenHeight - The height of the image with the screens.
	 * @param {array} list - A list with the points of the screens.
     * @param {boolean} center - Whether or not to center the image.
	 */
export function getPointsTranslatedToImage(width: number, height: number, screenWidth: number, screenHeight: number, list: Array<Point>, center: boolean = false) {
    let xRatio: number = width / screenWidth;
    let yRatio: number = height / screenHeight;
    let ratio: number = Math.min(xRatio, yRatio);

    let deltaX: number = 0
    let deltaY: number = 0
    if (center) {
        if (xRatio > yRatio) {
            deltaX = (width - screenWidth * yRatio) / 2;
        }
        if (yRatio > xRatio) {
            deltaY = (height - screenHeight * xRatio) / 2;
        }
    }

    for (let i = 0; i < list.length; i++) {
        const point: Point = list[i];
        list[i] = new Point(point.x * ratio + deltaX, point.y * ratio + deltaY);
    }

    return list;
}

/**
	 * Translates the slaveScreens to find their coordinates on the image to project.
     * Returns the list with the translated slaveScreens.
     * @param {number} width - The width of the image to cast.
     * @param {number} height - The height of the image to cast.
	 * @param {array} list - A list with the slaveScreens.
     * @param {boolean} center - Whether or not to center the image. (Default: false)
	 */
export function getScreensTranslatedToImage(width: number, height: number, list: Array<SlaveScreen>, center: boolean = false) {
    let points: Array<Point> = slaveScreensToPoints(list);

    let box: Array<Point> = getSurroundingBoxPoints(points);
    let screenWidth: number = box[1].x - box[0].x;
    let screenHeight: number = box[1].y - box[0].y;

    let boxedPoints: Array<Point> = getPointsTranslatedToBox(box[0].x, box[0].y, points);
    let translatedPoints: Array<Point> = getPointsTranslatedToImage(width, height, screenWidth, screenHeight, boxedPoints, center);

    return pointsToSlaveScreens(translatedPoints, list);
}

/**
	 * Turns a list of slaveScreens into a list of points
	 * @param {array} slaveScreens - A list with all the slaveScreens.
	 */
export function slaveScreensToPoints(slaveScreens: Array<SlaveScreen>) {
    let points: Array<Point> = [];

    slaveScreens.forEach(screen => {
        Array.prototype.push.apply(points, screen.corners);
    });

    return points;
}

/**
	 * Turns a list of corner points into a list of slaveScreens.
	 * @param {array} points - A list with all the points. (Must be %4!)
     * @param {array} list - A list with all the original slaveScreens.
	 */
export function pointsToSlaveScreens(points: Array<Point>, list: Array<SlaveScreen>) {
    let screens: Array<SlaveScreen> = [];

    for (let i = 0; i < points.length; i+=4) {
        let corners: Array<Point> = [points[i], points[i+1], points[i+2], points[i+3]];
        let screen: SlaveScreen = new SlaveScreen(corners, list[i].slaveID);
        screen.slaveID = list[i].slaveID;
        screens.push(screen);
    }

    return screens;
}