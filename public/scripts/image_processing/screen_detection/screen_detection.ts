// TODO: It might be nice to check whether the corners enclose an area that exists of over THRESHOLD colored pixels

import Point from "./Point";
import Line from "./Line";
import convexHull from "./hull";

import { IHSLColor, IRGBAColor, IHSLRange } from "../../types/Color";

const similarPinkRange: IHSLRange = {
    hRange: 50,
    sRange: 40,
    lRange: 40,
};

const randomColorRange: IHSLRange = {
    hRange: 50,
    sRange: 40,
    lRange: 40,
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

const calcNeighborPixelsInRange = (range: number) => {
    return Array(range)
        .fill(1)
        .map((_, index) => 8 * (index + 1))
        .reduce((a, b) => a + b, 0);
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
    const t0 = new Date();

    const screenColorHSL: IHSLColor = rgbToHsl(
        screenColorRGBA.r,
        screenColorRGBA.g,
        screenColorRGBA.b
    );

    const IMMEDIATE_NEIGHBOR_RANGE = 2;

    const LOST_PIXEL_THRESHOLD_SHORT =
        calcNeighborPixelsInRange(IMMEDIATE_NEIGHBOR_RANGE) * 0.1;
    const MAX_CORNER_NEIGHBORS =
        calcNeighborPixelsInRange(IMMEDIATE_NEIGHBOR_RANGE) * 0.55;

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
                    coloredNeighbors >= LOST_PIXEL_THRESHOLD_SHORT &&
                    coloredNeighbors <= MAX_CORNER_NEIGHBORS
                ) {
                    possibleCorners.push(new Point(x, y));
                }
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

    if (possibleCorners.length < 4) {
        return [];
    } else if (possibleCorners.length === 4) {
        return possibleCorners;
    }

    possibleCorners = removeOutliers(possibleCorners);

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
        console.log("No outliers displayed!");
        //@ts-ignore
        while (currentStep !== 4) {
            await wait(250);
        }
    }

    if (possibleCorners.length < 4) {
        return [];
    } else if (possibleCorners.length === 4) {
        return possibleCorners;
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
        while (currentStep !== 5) {
            await wait(250);
        }
    }

    if (possibleCorners.length < 4) {
        return [];
    } else if (possibleCorners.length === 4) {
        return possibleCorners;
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

    const corners = findFinalCorners(possibleCornerConnections);
    corners.forEach(corner => {
        console.log(corner.toString());
    });

    if (DEBUG) {
        const _canvas = createCanvas(width, height);
        _canvas.id = "canvas";
        const _ctx = _canvas.getContext("2d");
        _ctx.fillStyle = "rgb(0, 255, 255)";
        corners.forEach(corner => {
            _ctx.beginPath();
            _ctx.arc(corner.x, corner.y, 20, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.closePath();
        });
        displayDebugResult(_canvas);
        console.log("Displaying final corners!");
        //@ts-ignore
        while (currentStep !== 7) {
            await wait(250);
        }
    }

    console.log(+new Date() - +t0 + "ms");

    return corners;
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

// From: https://gist.github.com/mjackson/5311256
export function rgbToHsl(r: number, g: number, b: number): IHSLColor {
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
export function getRGBAColorForPixel(
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
export function getHSLColorForPixel(
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
export function isSimilarHSLColor(
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
export function amountOfNeighboringPixelsWithColor(
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

function removeOutliers(possibleCorners: Point[]) {
    const MAX_AVG_DISTANCE_DIFF_THRESHOLD = 1.25;

    /**
     * Keeps an object with the index of the corners as the keys and the longest connection as the value
     */
    const longestCornerConnection: { [cornerIndex: number]: number } = {};

    const totalDistancesBetweenPoints: number[] = [];
    possibleCorners.forEach((corner, index) => {
        for (let i = index + 1; i < possibleCorners.length; i++) {
            const distance = corner.distanceTo(possibleCorners[i]);
            totalDistancesBetweenPoints.push(distance);
            if (!longestCornerConnection[index]) {
                longestCornerConnection[index] = distance;
            } else {
                longestCornerConnection[index] += distance;
            }
            if (!longestCornerConnection[i]) {
                longestCornerConnection[i] = distance;
            } else {
                longestCornerConnection[i] += distance;
            }
        }
    });

    const avgTotalDistancesBetweenCorners =
        Object.values(longestCornerConnection).reduce((a, b) => a + b, 0) /
        Object.values(longestCornerConnection).length;

    for (const [index, length] of Object.entries(longestCornerConnection)) {
        if (
            length >
            avgTotalDistancesBetweenCorners * MAX_AVG_DISTANCE_DIFF_THRESHOLD
        ) {
            const indexToRemove = parseInt(index);
            possibleCorners = [
                ...possibleCorners.slice(0, indexToRemove),
                ...possibleCorners.slice(indexToRemove + 1),
            ];
        }
    }

    return possibleCorners;
}

/**
 * Searches the final 4 corners of the screen.
 * @param cornerConnections - Connected possible corners.
 */
function findFinalCorners(cornerConnections: Line[]): Point[] {
    if (cornerConnections.length === 0) return [];
    if (cornerConnections.length === 1)
        return [...cornerConnections[0].endPoints];
    if (cornerConnections.length === 2)
        return [
            ...cornerConnections[0].endPoints,
            ...cornerConnections[0].endPoints,
        ];

    const sortedPossibleCornersConnections = cornerConnections.sort(
        (connectionA, connectionB) => connectionB.length - connectionA.length
    );

    const minDistanceBetweenCorners = 50;
    let firstCornerConnection: Line = sortedPossibleCornersConnections.shift();
    let secondCornerConnection: Line;
    for (let i = 0; i < sortedPossibleCornersConnections.length; i++) {
        const connection = sortedPossibleCornersConnections[i];
        if (
            connection.a.distanceTo(firstCornerConnection.a) >
                minDistanceBetweenCorners &&
            connection.a.distanceTo(firstCornerConnection.b) >
                minDistanceBetweenCorners &&
            connection.b.distanceTo(firstCornerConnection.a) >
                minDistanceBetweenCorners &&
            connection.b.distanceTo(firstCornerConnection.b) >
                minDistanceBetweenCorners
        ) {
            secondCornerConnection = connection;
            break;
        }
    }

    if (!secondCornerConnection) {
        return [];
    }

    return [
        ...firstCornerConnection.endPoints,
        ...(secondCornerConnection.endPoints || []),
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
