import { Orientation } from "./orientations";
import SlaveScreen from "../../util/SlaveScreen";

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
const colors = [
    leftUpperColor,
    rightUpperColor,
    rightUnderColor,
    leftUnderColor,
];

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceTo(point: Point) {
        return Math.sqrt(
            Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
        );
    }
}


function getHSLColorForPixel(
    x: number,
    y: number,
    width: number,
    pixels: Uint8ClampedArray
): IHSLColor {
    const rgba = getRGBAColorForPixel(x, y, width, pixels);
    return rgbToHsl(rgba.r, rgba.g, rgba.b);
}

function getRGBAColorForPixel(
    x: number,
    y: number,
    width: number,
    pixels: Uint8ClampedArray
): IRGBAColor {
    const i = y * (width * 4) + x * 4;
    return {
        r: pixels[i],
        g: pixels[i + 1],
        b: pixels[i + 2],
        a: pixels[i + 3],
    };
}

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


const leftWidthPoint:Point = null;
const rightWidthPoint:Point = null;

function setWidthEdgePoints(p1:Point,p2:Point) {
        let leftWidthPoint = p1;
        let rightWidthPoint = p2;
}

export function getWidthEdgePoints() {
    return [leftWidthPoint, rightWidthPoint];
}
/**
 * Label all the corners
 */
function cornerLabeling(p1: Point, p2: Point, p3: Point, p4: Point) {
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




export default function calculateOrientation(
    screen: SlaveScreen,
    canvas: HTMLCanvasElement
) {

    if (screen.corners.length !== 4) {
        return Orientation.NONE;
    }

    const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;


    /**New try with all 4 corners their colors*/
    let corners: Point[] = [];
    screen.corners.forEach(corner => {
        corners.push(corner.copy());
    });
    let labeledCorners = cornerLabeling(corners[0], corners[1], corners[2], corners[3]);

    let leftUpCoordinates: Array<Point> = [];
    let rightUpCoordinates: Array<Point> = [];
    let leftUnderCoordinates: Array<Point> = [];
    let rightUnderCoordinates: Array<Point> = [];

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
    let counterNormal = 0;
    let counterClockwise = 0;
    let counterCounterClockwise = 0;
    let counterFlipped = 0;

    for (let point of leftUpCoordinates) {
        let leftUpperPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(leftUpperPixelColor, leftUpperColor, colorRange)) {
            counterNormal++;
        }
        if (isSimilarHSLColor(leftUpperPixelColor, rightUpperColor, colorRange)) {
            counterCounterClockwise++;
        }
        if (isSimilarHSLColor(leftUpperPixelColor, rightUnderColor, colorRange)) {
            counterFlipped++;
        }
        if (isSimilarHSLColor(leftUpperPixelColor, leftUnderColor, colorRange)) {
            counterClockwise++;
        }
    }

    for (let point of rightUpCoordinates) {
        let rightUpperPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(rightUpperPixelColor, rightUpperColor, colorRange)) {
            counterNormal++;
        }
        if (isSimilarHSLColor(rightUpperPixelColor, rightUnderColor, colorRange)) {
            counterCounterClockwise++;
        }
        if (isSimilarHSLColor(rightUpperPixelColor, leftUnderColor, colorRange)) {
            counterFlipped++;
        }
        if (isSimilarHSLColor(rightUpperPixelColor, leftUpperColor, colorRange)) {
            counterClockwise++;
        }
    }

    for (let point of leftUnderCoordinates) {
        let leftUnderPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(leftUnderPixelColor, leftUnderColor, colorRange)) {
            counterNormal++;
        }
        if (isSimilarHSLColor(leftUnderPixelColor, leftUpperColor, colorRange)) {
            counterCounterClockwise++;
        }
        if (isSimilarHSLColor(leftUnderPixelColor, rightUpperColor, colorRange)) {
            counterFlipped++;
        }
        if (isSimilarHSLColor(leftUnderPixelColor, rightUnderColor, colorRange)) {
            counterClockwise++;
        }
    }


    for (let point of rightUnderCoordinates) {
        let rightUnderPixelColor = getHSLColorForPixel(
            point.x,
            point.y,
            canvas.width,
            pixels);
        if (isSimilarHSLColor(rightUnderPixelColor, rightUnderColor, colorRange)) {
            counterNormal++;
        }
        if (isSimilarHSLColor(rightUnderPixelColor, leftUnderColor, colorRange)) {
            counterCounterClockwise++;
        }
        if (isSimilarHSLColor(rightUnderPixelColor, leftUpperColor, colorRange)) {
            counterFlipped++;
        }
        if (isSimilarHSLColor(rightUnderPixelColor, rightUpperColor, colorRange)) {
            counterClockwise++;
        }
    }

    let list: Array<number> = [counterClockwise, counterFlipped, counterCounterClockwise, counterNormal];
    list.sort((a, b) => b - a);
    console.log(list);

    if (list[0] === counterNormal) {
        console.log(Orientation.NORMAL);
        setWidthEdgePoints(labeledCorners.LeftUp, labeledCorners.RightUp);
        return Orientation.NORMAL;
    }

    if (list[0] === counterCounterClockwise) {
        console.log(Orientation.COUNTERCLOCKWISE);
        setWidthEdgePoints(labeledCorners.LeftUnder, labeledCorners.LeftUp);
        return Orientation.COUNTERCLOCKWISE;
    }

    if (list[0] === counterFlipped) {
        console.log(Orientation.FLIPPED);
        setWidthEdgePoints(labeledCorners.LeftUnder, labeledCorners.RightUnder);
        return Orientation.FLIPPED;
    }

    if (list[0] === counterClockwise) {
        console.log(Orientation.CLOCKWISE);
        setWidthEdgePoints(labeledCorners.RightUp, labeledCorners.RightUnder);
        return Orientation.CLOCKWISE;
    }

}
