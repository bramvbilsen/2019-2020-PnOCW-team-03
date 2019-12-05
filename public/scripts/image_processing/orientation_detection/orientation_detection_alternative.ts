import { Orientation } from "./orientations";
import SlaveScreen from "../../util/SlaveScreen";
import Point from "../screen_detection/Point";
import { sortCorners } from "../../util/shapes";
import { getHSLColorForPixel } from "../screen_detection/screen_detection";
import Line from "../screen_detection/Line";

/**
 * Initializing constants
 *
 */

interface IRGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface IHSLRange {
    hRange: number;
    sRange: number;
    lRange: number;
}

interface IHSLColor {
    h: number;
    s: number;
    l: number;
}
const colorRange: IHSLRange = {
    hRange: 40,
    sRange: 40,
    lRange: 50,
};
const leftUpperColor: IHSLColor = rgbToHsl(255, 70, 180); //pink
const rightUpperColor: IHSLColor = rgbToHsl(0, 255, 25); // green
const rightUnderColor: IHSLColor = rgbToHsl(12, 0, 255); // blue
const leftUnderColor: IHSLColor = rgbToHsl(255, 216, 0); // yellow

/**
 *
 * @param colorA - Color to compare to `colorB`
 * @param colorB - Color to compare to `colorA`
 * @param params - Range to controll how similar both colors have to be.
 */
function isSimilarHSLColor(
    colorA: IHSLColor,
    colorB: IHSLColor,
    params: IHSLRange
): boolean {
    if (
        Math.abs(colorA.h - colorB.h) <= params.hRange &&
        Math.abs(colorA.s - colorB.s) <= params.sRange &&
        Math.abs(colorA.l - colorB.l) <= params.lRange
    ) {
        return true;
    }
    return false;
}

function rgbToHsl(r: number, g: number, b: number): IHSLColor {
    (r /= 255), (g /= 255), (b /= 255);
    let max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getWidthEdgePoints(left: Point, right: Point) {
    return [left, right];
}

export function labelCorners(p1: Point, p2: Point, p3: Point, p4: Point) {
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

/**
 * 
 * @param screen 
 * @param canvas 
 * @returns `{orientation: Orientation, normalTopEdge: Line}`
 *     `orientation` holds information regarding the orientation of the screen.
 *     `normalTopEdge` holds the edge which would be the top edge for normal orientation.
 */
export default function calculateOrientation(
    screen: SlaveScreen,
    canvas: HTMLCanvasElement
): Orientation {

    if (screen.corners.length !== 4) {
        return Orientation.NORMAL;
    }

    const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;


    /**New try with all 4 corners their colors*/
    const corners: Point[] = screen.corners.map(corner => corner.copy());
    const labeledCorners = sortCorners(corners);

    const leftUpCoordinates: Array<Point> = [];
    const rightUpCoordinates: Array<Point> = [];
    const leftUnderCoordinates: Array<Point> = [];
    const rightUnderCoordinates: Array<Point> = [];

    /**Get lists of diagonal points starting from each corner, for color comparison later*/
    for (let i = 0; i <= 10; i++) {
        //LU
        labeledCorners.LeftUp.x += i;
        labeledCorners.LeftUp.y += i;
        leftUpCoordinates.push(new Point(labeledCorners.LeftUp.x, labeledCorners.LeftUp.y));

        //RU
        labeledCorners.RightUp.x -= i;
        labeledCorners.RightUp.y += i;
        rightUpCoordinates.push(new Point(labeledCorners.RightUp.x, labeledCorners.RightUp.y));

        //LD
        labeledCorners.LeftUnder.x += i;
        labeledCorners.LeftUnder.y -= i;
        leftUnderCoordinates.push(new Point(labeledCorners.LeftUnder.x, labeledCorners.LeftUnder.y));

        //RD
        labeledCorners.RightUnder.x -= i;
        labeledCorners.RightUnder.y -= i;
        rightUnderCoordinates.push(new Point(labeledCorners.RightUnder.x, labeledCorners.RightUnder.y));
    }

    /**Calculate Colors and count the amount of times it corresponds with an expected orientation color*/
    let counter_normal = 0;
    let counter_clockwise = 0;
    let counter_counterClockwise = 0;
    let counter_flipped = 0;

    for (const point of leftUpCoordinates) {
        const leftUpperPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(leftUpperPixelColor, leftUpperColor, colorRange)) {
            counter_normal++;
        }
        if (isSimilarHSLColor(leftUpperPixelColor, rightUpperColor, colorRange)) {
            counter_counterClockwise++;
        }
        if (isSimilarHSLColor(leftUpperPixelColor, rightUnderColor, colorRange)) {
            counter_flipped++;
        }
        if (isSimilarHSLColor(leftUpperPixelColor, leftUnderColor, colorRange)) {
            counter_clockwise++;
        }
    }

    for (const point of rightUpCoordinates) {
        const rightUpperPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(rightUpperPixelColor, rightUpperColor, colorRange)) {
            counter_normal++;
        }
        if (isSimilarHSLColor(rightUpperPixelColor, rightUnderColor, colorRange)) {
            counter_counterClockwise++;
        }
        if (isSimilarHSLColor(rightUpperPixelColor, leftUnderColor, colorRange)) {
            counter_flipped++;
        }
        if (isSimilarHSLColor(rightUpperPixelColor, leftUpperColor, colorRange)) {
            counter_clockwise++;
        }
    }

    for (const point of leftUnderCoordinates) {
        const leftUnderPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(leftUnderPixelColor, leftUnderColor, colorRange)) {
            counter_normal++;
        }
        if (isSimilarHSLColor(leftUnderPixelColor, leftUpperColor, colorRange)) {
            counter_counterClockwise++;
        }
        if (isSimilarHSLColor(leftUnderPixelColor, rightUpperColor, colorRange)) {
            counter_flipped++;
        }
        if (isSimilarHSLColor(leftUnderPixelColor, rightUnderColor, colorRange)) {
            counter_clockwise++;
        }
    }

    for (const point of rightUnderCoordinates) {
        const rightUnderPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(rightUnderPixelColor, rightUnderColor, colorRange)) {
            counter_normal++;
        }
        if (isSimilarHSLColor(rightUnderPixelColor, leftUnderColor, colorRange)) {
            counter_counterClockwise++;
        }
        if (isSimilarHSLColor(rightUnderPixelColor, leftUpperColor, colorRange)) {
            counter_flipped++;
        }
        if (isSimilarHSLColor(rightUnderPixelColor, rightUpperColor, colorRange)) {
            counter_clockwise++;
        }
    }

    const maxOrientationCount = Math.max(counter_clockwise, counter_flipped, counter_counterClockwise, counter_normal);

    switch (maxOrientationCount) {
        case counter_normal:
            return Orientation.NORMAL;
        case counter_clockwise:
            return Orientation.CLOCKWISE;
        case counter_counterClockwise:
            return Orientation.COUNTERCLOCKWISE;
        case counter_flipped:
            return Orientation.FLIPPED;
        default:
            return Orientation.NORMAL
    }
}
