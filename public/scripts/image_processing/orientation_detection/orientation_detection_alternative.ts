import { Orientation } from "./orientations";
import SlaveScreen from "../../util/SlaveScreen";
import Point from "../screen_detection/Point";
import { sortCorners } from "../../util/shapes";
import { getHSLColorForPixel, amountOfNeighboringPixelsWithColor } from "../screen_detection/screen_detection";
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
    hRange: 50,
    sRange: 60,
    lRange: 60,
};
const leftUpperColor: IHSLColor = { h: 324, s: 100, l: 63.7 }; //pink
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
export default function calculateScreenAngle(
    screen: SlaveScreen,
    canvas: HTMLCanvasElement
): number {

    if (screen.corners.length !== 4) {
        return 0;
    }

    const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;


    /**New try with all 4 corners their colors*/
    const corners: Point[] = screen.corners.map(corner => corner.copy());
    const sortedCorners = sortCorners(corners);
    console.log("CORNERS AT START OF ANGLE DETECTION: " + JSON.stringify(sortedCorners));

    const centroid = screen.centroid;

    let leftUp: Point = sortedCorners.LeftUp;
    let rightUp: Point = sortedCorners.RightUp;

    const ctx = canvas.getContext("2d");

    const topLeftDiag = (new Line(sortedCorners.LeftUp, centroid));
    let xdir = (centroid.x - sortedCorners.LeftUp.x) / topLeftDiag.length;
    let ydir = (centroid.y - sortedCorners.LeftUp.y) / topLeftDiag.length;
    let x = sortedCorners.LeftUp.x;
    let y = sortedCorners.LeftUp.y;
    let pinkPixelsTopLeft = 0;
    for (let i = 0; i < topLeftDiag.length; i++) {
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        const pixelColor = getHSLColorForPixel(Math.round(x), Math.round(y), canvas.width, pixels);
        if (isSimilarHSLColor(leftUpperColor, pixelColor, colorRange)) {
            pinkPixelsTopLeft++;
        }
        x += xdir;
        y += ydir;
    }
    console.log("Pink in top left: " + pinkPixelsTopLeft);

    const topRightDiag = (new Line(sortedCorners.RightUp, centroid));
    xdir = (centroid.x - sortedCorners.RightUp.x) / topRightDiag.length;
    ydir = (centroid.y - sortedCorners.RightUp.y) / topRightDiag.length;
    x = sortedCorners.RightUp.x;
    y = sortedCorners.RightUp.y;
    let pinkPixelsTopRight = 0;
    for (let i = 0; i < topRightDiag.length; i++) {
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        const pixelColor = getHSLColorForPixel(Math.round(x), Math.round(y), canvas.width, pixels);
        if (isSimilarHSLColor(leftUpperColor, pixelColor, colorRange)) {
            pinkPixelsTopRight++;
        }
        x += xdir;
        y += ydir;
    }
    console.log("Pink in top right: " + pinkPixelsTopRight);

    const bottomLeftDiag = (new Line(sortedCorners.LeftUnder, centroid));
    xdir = (centroid.x - sortedCorners.LeftUnder.x) / bottomLeftDiag.length;
    ydir = (centroid.y - sortedCorners.LeftUnder.y) / bottomLeftDiag.length;
    x = sortedCorners.LeftUnder.x;
    y = sortedCorners.LeftUnder.y;
    let pinkPixelsBottomLeft = 0;
    for (let i = 0; i < bottomLeftDiag.length; i++) {
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        const pixelColor = getHSLColorForPixel(Math.round(x), Math.round(y), canvas.width, pixels);
        if (isSimilarHSLColor(leftUpperColor, pixelColor, colorRange)) {
            pinkPixelsBottomLeft++;
        }
        x += xdir;
        y += ydir;
    }
    console.log("Pink in bottom left: " + pinkPixelsBottomLeft);

    const bottomRightDiag = (new Line(sortedCorners.RightUnder, centroid));
    xdir = (centroid.x - sortedCorners.RightUnder.x) / bottomRightDiag.length;
    ydir = (centroid.y - sortedCorners.RightUnder.y) / bottomRightDiag.length;
    x = sortedCorners.RightUnder.x;
    y = sortedCorners.RightUnder.y;
    let pinkPixelsBottomRight = 0;
    for (let i = 0; i < bottomRightDiag.length; i++) {
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        const pixelColor = getHSLColorForPixel(Math.round(x), Math.round(y), canvas.width, pixels);
        if (isSimilarHSLColor(leftUpperColor, pixelColor, colorRange)) {
            pinkPixelsBottomRight++;
        }
        x += xdir;
        y += ydir;
    }
    console.log("Pink in bottom right: " + pinkPixelsBottomRight);

    $("body").append(canvas);

    const maxPinkPixels = Math.max(pinkPixelsTopLeft, pinkPixelsTopRight, pinkPixelsBottomLeft, pinkPixelsBottomRight);
    if (maxPinkPixels === pinkPixelsTopLeft) {
        leftUp = sortedCorners.LeftUp;
        rightUp = sortedCorners.RightUp;
    } else if (maxPinkPixels === pinkPixelsTopRight) {
        leftUp = sortedCorners.RightUp;
        rightUp = sortedCorners.RightUnder;
    } else if (maxPinkPixels === pinkPixelsBottomRight) {
        leftUp = sortedCorners.RightUnder;
        rightUp = sortedCorners.LeftUnder;
    } else {
        leftUp = sortedCorners.LeftUnder;
        rightUp = sortedCorners.LeftUp;
    }

    let theta =
        Math.atan2(rightUp.y - leftUp.y, rightUp.x - leftUp.x) *
        180 /
        Math.PI;

    if (theta < 0) {
        theta = 360 + theta;
    }

    console.log("Left up according to screen: " + leftUp);

    return theta;
}
