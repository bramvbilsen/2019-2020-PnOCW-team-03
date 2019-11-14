import Point from "./Point";
import Line from "./Line";
import convexHull from "./hull";

import { IHSLColor, IRGBAColor } from "../../types/Color";
import env from "../../../env/env";
import {
    PREFERRED_CANVAS_WIDTH,
    PREFERRED_CANVAS_HEIGHT,
} from "../../CONSTANTS";

interface IHSLRange {
    hRange: number;
    sRange: number;
    lRange: number;
}

const similarPinkRange: IHSLRange = {
    hRange: 50,
    sRange: 50,
    lRange: 50,
};

const randomColorRange: IHSLRange = {
    hRange: 52,
    sRange: 52,
    lRange: 52,
};

//@ts-ignore
window.currentStep = 0;

document.onkeypress = e => {
    //@ts-ignore
    window.currentStep++;
    console.log("new step");
};

const wait = async (ms: number) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

/**
 *
 * @param nonColoredImgPath - Path to image for slave without color.
 * @param coloredImgPath - Path to image for slave with color.
 * @param screenColorRGBA - Slave's color.
 * @param DEBUG - Whether or not to debug (change this later)
 */
export default async function findScreen(
    nonColoredScreenCanvas: HTMLCanvasElement,
    coloredScreenCanvas: HTMLCanvasElement,
    screenColorRGBA: IRGBAColor,
    DEBUG = false
) {
    console.log("STARTING SCREEN DETECTION ALGORITHM");

    const screenColorHSL: IHSLColor = rgbToHsl(
        screenColorRGBA.r,
        screenColorRGBA.g,
        screenColorRGBA.b
    );

    const IMMEDIATE_NEIGHBOR_RANGE = 1;
    const LOST_PIXEL_THRESHOLD_SHORT = 8 * IMMEDIATE_NEIGHBOR_RANGE * 0.2;
    const MAX_CORNER_NEIGHBORS = 8 * IMMEDIATE_NEIGHBOR_RANGE * 0.5;

    const width = nonColoredScreenCanvas.width;
    const height = nonColoredScreenCanvas.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(nonColoredScreenCanvas, 0, 0);

    const nonColoredScreenCtx = <CanvasRenderingContext2D>(
        nonColoredScreenCanvas.getContext("2d")
    );
    const nonColoredScreenPixelData = nonColoredScreenCtx.getImageData(
            0,
            0,
            width,
            height
        ),
        nonColoredScreenPixels = nonColoredScreenPixelData.data;

    if (DEBUG) {
        displayDebugResult(nonColoredScreenCanvas);
        console.log("Non colored screen displayed!");
        //@ts-ignore
        while (currentStep !== 1) {
            await wait(250);
        }
    }

    const coloredScreenCtx = <CanvasRenderingContext2D>(
        coloredScreenCanvas.getContext("2d")
    );
    const coloredScreenPixelData = coloredScreenCtx.getImageData(
            0,
            0,
            width,
            height
        ),
        coloredScreenPixels = coloredScreenPixelData.data;

    if (DEBUG) {
        displayDebugResult(coloredScreenCanvas);
        console.log("Colored screen displayed!");
        //@ts-ignore
        while (currentStep !== 2) {
            await wait(250);
        }
    }

    const resultingScreenCanvas = createCanvas(width, height);
    const resultingScreenCtx = <CanvasRenderingContext2D>(
        resultingScreenCanvas.getContext("2d")
    );
    resultingScreenCtx.fillStyle = "rgb(0, 0, 0)";
    resultingScreenCtx.fillRect(0, 0, width, height);
    const resultingScreenImageData = resultingScreenCtx.getImageData(
            0,
            0,
            width,
            height
        ),
        resultingPixels = resultingScreenImageData.data;

    let possibleCorners: Point[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const linearizedIndex = (width * y + x) * 4;
            const noScreenColor = getHSLColorForPixel(
                x,
                y,
                width,
                nonColoredScreenPixels
            );
            const screenColor = getHSLColorForPixel(
                x,
                y,
                width,
                coloredScreenPixels
            );
            if (
                !isSimilarHSLColor(
                    noScreenColor,
                    screenColor,
                    randomColorRange
                ) &&
                isSimilarHSLColor(screenColorHSL, screenColor, similarPinkRange)
            ) {
                const coloredNeighbors = amountOfNeighboringPixelsWithColor(
                    coloredScreenPixels,
                    IMMEDIATE_NEIGHBOR_RANGE,
                    x,
                    y,
                    width,
                    height,
                    screenColorHSL
                );
                if (
                    coloredNeighbors > LOST_PIXEL_THRESHOLD_SHORT &&
                    coloredNeighbors <= MAX_CORNER_NEIGHBORS
                ) {
                    resultingPixels[linearizedIndex] = screenColorRGBA.r;
                    resultingPixels[linearizedIndex + 1] = screenColorRGBA.g;
                    resultingPixels[linearizedIndex + 2] = screenColorRGBA.b;
                    possibleCorners.push(new Point(x, y));
                } else {
                    resultingPixels[linearizedIndex] = 0;
                    resultingPixels[linearizedIndex + 1] = 0;
                    resultingPixels[linearizedIndex + 2] = 0;
                }
            } else {
                resultingPixels[linearizedIndex] = 0;
                resultingPixels[linearizedIndex + 1] = 0;
                resultingPixels[linearizedIndex + 2] = 0;
            }
        }
    }

    if (DEBUG) {
        const _canvas = createCanvas(width, height);
        _canvas.id = "canvas";
        const _ctx = _canvas.getContext("2d");
        _ctx.fillStyle = "rgb(0, 255, 255)";
        possibleCorners.forEach(corner => {
            _ctx.beginPath();
            _ctx.arc(corner.x, corner.y, 20, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.closePath();
        });
        displayDebugResult(_canvas);
        console.log("Extracted screen displayed!");
        //@ts-ignore
        while (currentStep !== 3) {
            await wait(250);
        }
    }

    possibleCorners = convexHull(possibleCorners);

    if (DEBUG) {
        const _canvas = createCanvas(width, height);
        _canvas.id = "canvas";
        const _ctx = _canvas.getContext("2d");
        _ctx.fillStyle = "rgb(0, 255, 255)";
        possibleCorners.forEach(corner => {
            _ctx.beginPath();
            _ctx.arc(corner.x, corner.y, 20, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.closePath();
        });
        displayDebugResult(_canvas);
        console.log("Convex hull corners displayed!");
        //@ts-ignore
        while (currentStep !== 4) {
            await wait(250);
        }
    }

    if (possibleCorners.length === 4) {
        return possibleCorners;
    }
    const possibleCornerConnections = createConnections(possibleCorners);

    if (DEBUG) {
        displayDebugResult(
            drawResultLines(width, height, possibleCornerConnections, 20)
        );
        console.log("Connected corners displayed!");
        //@ts-ignore
        while (currentStep !== 6) {
            await wait(250);
        }
    }

    const corners = findFinalCorners(
        possibleCornerConnections,
        coloredScreenPixels,
        screenColorHSL
    );

    return corners;
}

type Image = HTMLImageElement;
async function loadImage(src: string): Promise<Image> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            resolve(img);
        };
        img.onerror = err => {
            reject(err);
        };
    });
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

// From: https://gist.github.com/mjackson/5311256
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

// From: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
/**
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param width - Width of the image.
 * @param pixels - Pixels of the image.
 */
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
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param width - Width of the image.
 * @param pixels - Pixels of the image.
 */
function getHSLColorForPixel(
    x: number,
    y: number,
    width: number,
    pixels: Uint8ClampedArray
): IHSLColor {
    const rgba = getRGBAColorForPixel(x, y, width, pixels);
    return rgbToHsl(rgba.r, rgba.g, rgba.b);
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

/**
 * Checks whether the neighboring pixels have a similar color to `hslColor`.
 * @param pixels - Pixels of the image
 * @param searchRange - The range from (`x`, `y`) to other pixels that are considered neighbors.
 * A value of `1` will result in the 8 directly neighboring pixels (every direction) that will be checked.
 * @param x - X coordinate of the pixel of which to check the neighbors.
 * @param y - Y coordinate of the pixel of which to check the neighbors.
 * @param width - Width of the image.
 * @param height - Height of the image.
 * @param hslColor - Color to be checked.
 */
function amountOfNeighboringPixelsWithColor(
    pixels: Uint8ClampedArray,
    searchRange: number,
    x: number,
    y: number,
    width: number,
    height: number,
    hslColor: IHSLColor
) {
    let result = 0;
    if (searchRange <= 0) return result;

    for (let range = 1; range <= searchRange; range++) {
        if (
            x > range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x - range, y, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            y > range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x, y - range, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            x < width - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x + range, y, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            y < height - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x, y + range, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            x > range &&
            y > range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x - range, y - range, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            x < width - range &&
            y > range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x + range, y - range, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            x > range &&
            y < height - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x - range, y + range, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
        if (
            x < width - range &&
            y < height - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x + range, y + range, width, pixels),
                hslColor,
                similarPinkRange
            )
        ) {
            result++;
        }
    }

    return result;
}

/**
 * Creates all possible connections between the given `points`
 * @param points - Points to be connected.
 */
function createConnections(points: Point[]) {
    const connections: Line[] = [];
    points.forEach((corner, index) => {
        for (let i = index; i < points.length; i++) {
            connections.push(new Line(corner, points[i]));
        }
    });
    return connections;
}

/**
 * Searches the final 4 corners of the screen.
 * @param cornerConnections - Connected possible corners.
 */
function findFinalCorners(
    cornerConnections: Line[],
    originalColoredScreenPixels: Uint8ClampedArray,
    color: IHSLColor
): Point[] {
    if (cornerConnections.length === 0) return [];

    const LOST_PIXEL_THRESHOLD_LONG_RANGE = 20;
    const LOST_PIXEL_THRESHOLD_LONG = 8 * LOST_PIXEL_THRESHOLD_LONG_RANGE * 0.2;

    const sortedPossibleCornersConnections = cornerConnections.sort(
        (connectionA, connectionB) => connectionB.length - connectionA.length
    );

    const minDistanceBetweenCorners = 50;
    let firstCornerConnection: Line;
    let corner1IsValid = false;
    let corner2IsValid = false;
    while (
        !(corner1IsValid && corner2IsValid) &&
        sortedPossibleCornersConnections.length > 0
    ) {
        firstCornerConnection = sortedPossibleCornersConnections.shift();
        corner1IsValid =
            amountOfNeighboringPixelsWithColor(
                originalColoredScreenPixels,
                LOST_PIXEL_THRESHOLD_LONG_RANGE,
                firstCornerConnection.a.x,
                firstCornerConnection.a.y,
                PREFERRED_CANVAS_WIDTH,
                PREFERRED_CANVAS_HEIGHT,
                color
            ) > LOST_PIXEL_THRESHOLD_LONG;
        corner2IsValid =
            amountOfNeighboringPixelsWithColor(
                originalColoredScreenPixels,
                LOST_PIXEL_THRESHOLD_LONG_RANGE,
                firstCornerConnection.b.x,
                firstCornerConnection.b.y,
                PREFERRED_CANVAS_WIDTH,
                PREFERRED_CANVAS_HEIGHT,
                color
            ) > LOST_PIXEL_THRESHOLD_LONG;
    }
    if (sortedPossibleCornersConnections.length === 0) {
        return firstCornerConnection.endPoints;
    }
    let secondCornerConnection: Line;
    for (let i = 0; i < sortedPossibleCornersConnections.length; i++) {
        const connection = sortedPossibleCornersConnections[i];
        corner1IsValid =
            amountOfNeighboringPixelsWithColor(
                originalColoredScreenPixels,
                LOST_PIXEL_THRESHOLD_LONG_RANGE,
                connection.a.x,
                connection.a.y,
                PREFERRED_CANVAS_WIDTH,
                PREFERRED_CANVAS_HEIGHT,
                color
            ) > LOST_PIXEL_THRESHOLD_LONG;
        corner2IsValid =
            amountOfNeighboringPixelsWithColor(
                originalColoredScreenPixels,
                LOST_PIXEL_THRESHOLD_LONG_RANGE,
                connection.b.x,
                connection.b.y,
                PREFERRED_CANVAS_WIDTH,
                PREFERRED_CANVAS_HEIGHT,
                color
            ) > LOST_PIXEL_THRESHOLD_LONG;
        if (
            connection.a.distanceTo(firstCornerConnection.a) >
                minDistanceBetweenCorners &&
            connection.a.distanceTo(firstCornerConnection.b) >
                minDistanceBetweenCorners &&
            connection.b.distanceTo(firstCornerConnection.a) >
                minDistanceBetweenCorners &&
            connection.b.distanceTo(firstCornerConnection.b) >
                minDistanceBetweenCorners &&
            corner1IsValid &&
            corner2IsValid
        ) {
            secondCornerConnection = connection;
            break;
        }
    }
    return [
        ...firstCornerConnection.endPoints,
        ...secondCornerConnection.endPoints,
    ];
}

function drawResultLines(
    width: number,
    height: number,
    lines: Line[],
    pointSize: number
) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgb(50, 90, 60)";
    ctx.fillStyle = "rgb(255, 0, 0)";
    lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.a.x, line.a.y);
        ctx.lineTo(line.b.x, line.b.y);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(line.a.x, line.a.y, pointSize, 0, 2 * Math.PI);
        ctx.arc(line.b.x, line.b.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    });

    return canvas;
}

function displayDebugResult(canvasToDisplay: HTMLCanvasElement) {
    $("#result-img").attr("src", canvasToDisplay.toDataURL());
    $("#test-results-visual").attr("src", canvasToDisplay.toDataURL());
}
