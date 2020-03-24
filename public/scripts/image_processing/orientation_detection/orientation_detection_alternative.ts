import SlaveScreen from "../../util/SlaveScreen";
import Point from "../screen_detection/Point";
import { sortCorners } from "../../util/shapes";
import { getHSLColorForPixel } from "../screen_detection/screen_detection";
import Line from "../screen_detection/Line";

/**
 * Contains an RGB colour: red, green, blue and transparancy.
 */
interface IRGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Contains a HSL range: hue, saturation and lightness.
 */
interface IHSLRange {
    hRange: number;
    sRange: number;
    lRange: number;
}

/**
 * Contains a HSL colour: hue, saturation and lightness.
 */
interface IHSLColor {
    h: number;
    s: number;
    l: number;
}

/**
 * The range for which we accept a colour.
 */
const colorRange: IHSLRange = {
    hRange: 50,
    sRange: 60,
    lRange: 60,
};

/**
 * Initializing constants.
 * (The colours that we expect to find on the corners for orientation detection.)
 */
const leftUpperColor: IHSLColor = { h: 324, s: 100, l: 63.7 }; //pink
const rightUpperColor: IHSLColor = rgbToHsl(0, 255, 25); // green
const rightUnderColor: IHSLColor = rgbToHsl(12, 0, 255); // blue
const leftUnderColor: IHSLColor = rgbToHsl(255, 216, 0); // yellow

/**
 * Returns true if the two given colours are found to be within the given boundaries.
 * @param colorA - Color to compare to `colorB`
 * @param colorB - Color to compare to `colorA`
 * @param params - Range to control how similar both colors have to be.
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

/**
 * Returns an IHSLColor with the equivalent HSL colour.
 * @param r The red value.
 * @param g The green value.
 * @param b The blue value.
 */
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

/**
 * Returns the angle of the screen along with the ordered corners.
 * --> angle, LeftUp, RightUp, RightUnder and LeftUnder
 * @param screen The SlaveScreen to process.
 * @param canvas The canvas containing the slave with its orientation colours visible.
 */
export default function calculateScreenAngle(
    screen: SlaveScreen,
    canvas: HTMLCanvasElement
): {
    angle: number;
    LeftUp: Point;
    RightUp: Point;
    RightUnder: Point;
    LeftUnder: Point;
} {

    const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;

    /**New try with all 4 corners their colors*/
    const corners: Point[] = screen.corners.map(corner => corner.copy());
    const sortedCorners = sortCorners(corners);
    console.log("CORNERS AT START OF ANGLE DETECTION: " + JSON.stringify(sortedCorners));

    if (screen.corners.length !== 4) {
        return {
            angle: 0,
            LeftUnder: sortedCorners.LeftUnder,
            RightUnder: sortedCorners.RightUnder,
            RightUp: sortedCorners.RightUp,
            LeftUp: sortedCorners.LeftUp
        };
    }

    const centroid = screen.centroid;

    let leftUp: Point = sortedCorners.LeftUp;
    let rightUp: Point = sortedCorners.RightUp;
    let rightUnder: Point = sortedCorners.RightUnder;
    let leftUnder: Point = sortedCorners.LeftUnder;

    const ctx = canvas.getContext("2d");

    //Fixme Make a function to deal with this.

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

    const maxPinkPixels = Math.max(pinkPixelsTopLeft, pinkPixelsTopRight, pinkPixelsBottomLeft, pinkPixelsBottomRight);
    if (maxPinkPixels === pinkPixelsTopLeft) {
        leftUp = sortedCorners.LeftUp;
        rightUp = sortedCorners.RightUp;
        rightUnder = sortedCorners.RightUnder;
        leftUnder = sortedCorners.LeftUnder;
    } else if (maxPinkPixels === pinkPixelsTopRight) {
        leftUp = sortedCorners.RightUp;
        rightUp = sortedCorners.RightUnder;
        rightUnder = sortedCorners.LeftUnder;
        leftUnder = sortedCorners.LeftUp;
    } else if (maxPinkPixels === pinkPixelsBottomRight) {
        leftUp = sortedCorners.RightUnder;
        rightUp = sortedCorners.LeftUnder;
        rightUnder = sortedCorners.LeftUp;
        leftUnder = sortedCorners.RightUp;
    } else {
        leftUp = sortedCorners.LeftUnder;
        rightUp = sortedCorners.LeftUp;
        rightUnder = sortedCorners.RightUp;
        leftUnder = sortedCorners.RightUnder;
    }

    let theta =
        Math.atan2(rightUp.y - leftUp.y, rightUp.x - leftUp.x) *
        180 /
        Math.PI;

    if (theta < 0) {
        theta = 360 + theta;
    }

    console.log("Left up according to screen: " + leftUp);

    return {
        angle: theta,
        LeftUp: leftUp,
        LeftUnder: leftUnder,
        RightUp: rightUp,
        RightUnder: rightUnder
    };
}
