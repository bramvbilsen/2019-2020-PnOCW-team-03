import Point from "../../image_processing/screen_detection/Point";
import { createCanvas } from "../../image_processing/screen_detection/screen_detection";
import { CameraOverlay } from "./cameraOverlays";
import HtmlElem from "./HtmlElem";
import convert from "color-convert";
const deltaE = require("delta-e");

export class Camera extends HtmlElem {
    preferredResolutionWidth = 1920;
    preferredResolutionHeight = 1080;
    // preferredResolutionWidth = 352;
    // preferredResolutionHeight = 240;

    get elem(): HTMLVideoElement {
        return document.querySelector("#camera");
    }

    get videoWidth(): number {
        return this.elem.videoWidth;
    }

    get videoHeight(): number {
        return this.elem.videoHeight;
    }

    private addOverlays() {
        const elem = this.elem;
        const videoWidth = elem.videoWidth;
        const videoHeight = elem.videoHeight;
        const cameraOverlay = new CameraOverlay();
        cameraOverlay.width = videoWidth;
        cameraOverlay.height = videoHeight;
    }

    async start(): Promise<void> {
        const video = this.elem;

        if (navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: { max: this.preferredResolutionWidth },
                        height: { max: this.preferredResolutionHeight },
                    },
                });
                video.srcObject = stream;
                return new Promise((resolve, _) => {
                    video.oncanplay = () => {
                        this.addOverlays();
                        resolve();
                    };
                });
            } catch (e) {
                return new Promise((_, rej) => rej(e));
            }
        } else {
            return new Promise((_, rej) => rej("Could not get user media..."));
        }
    }

    snap(scale?: number): HTMLCanvasElement {
        scale = scale || 1;
        const elem = this.elem;
        const videoWidth = elem.videoWidth * scale;
        const videoHeight = elem.videoHeight * scale;
        const canvas = createCanvas(videoWidth, videoHeight);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(elem, 0, 0, videoWidth, videoHeight);
        return canvas;
    }

    differenceBnW(
        grayScaleData1: ImageData,
        grayScaleData2: ImageData
    ): Point[] {
        const pixels1 = grayScaleData1.data;
        const pixels2 = grayScaleData2.data;

        const diffPixels: Point[] = [];

        for (let y = 0; y < grayScaleData1.height; y++) {
            for (let x = 0; x < grayScaleData1.width; x++) {
                const i = y * (grayScaleData1.width * 4) + x * 4;
                const diff = Math.abs(pixels2[i] - pixels1[i]);
                if (diff >= 75) {
                    diffPixels.push(new Point(x, y));
                }
            }
        }

        return diffPixels;
    }

    whiteBalance(imageData: ImageData) {
        const pixels = imageData.data;

        let avgR = 0;
        let avgG = 0;
        let avgB = 0;
        let pixelAmt = pixels.length / 4;
        for (let i = 0; i < pixels.length; i += 4) {
            avgR += pixels[i];
            avgG += pixels[i + 1];
            avgB += pixels[i + 2];
        }
        avgR /= pixelAmt;
        avgG /= pixelAmt;
        avgB /= pixelAmt;
        const gray = avgR + avgG + avgB;
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] *= gray / avgR;
            pixels[i + 1] *= gray / avgG;
            pixels[i + 2] *= gray / avgB;
        }
    }

    onlyNearWhiteColors(imageData: ImageData) {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const hsl = convert.rgb.hsl.raw([
                data[i],
                data[i + 1],
                data[i + 2],
            ]);
            if (hsl[2] < 75) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
            }
        }
    }

    applyBigGaussianBlur(imageData: ImageData) {
        const modifiedPixels = imageData.data;
        const originalPixels = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;

        const div = 159;
        const kernel: Float32Array = new Float32Array([
            2 / div,
            4 / div,
            5 / div,
            4 / div,
            2 / div,
            4 / div,
            9 / div,
            12 / div,
            9 / div,
            4 / div,
            5 / div,
            12 / div,
            15 / div,
            12 / div,
            5 / div,
            4 / div,
            9 / div,
            12 / div,
            9 / div,
            4 / div,
            2 / div,
            4 / div,
            5 / div,
            4 / div,
            2 / div,
        ]);

        function redAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            if (i < 0 || i >= modifiedPixels.length) {
                return 0;
            }
            return originalPixels[i];
        }

        function greenAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            if (i < 0 || i >= modifiedPixels.length) {
                return 0;
            }
            return originalPixels[i + 1];
        }

        function blueAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            if (i < 0 || i >= modifiedPixels.length) {
                return 0;
            }
            return originalPixels[i + 2];
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0;
                let g = 0;
                let b = 0;
                let x_k = -2;
                let y_k = -2;
                for (let k = 0; k < kernel.length; k++) {
                    r += kernel[k] * redAt(x + x_k, y + y_k);
                    g += kernel[k] * greenAt(x + x_k, y + y_k);
                    b += kernel[k] * blueAt(x + x_k, y + y_k);
                    if (++x_k > 2) {
                        x_k = -2;
                        y_k++;
                    }
                }
                const i = y * (width * 4) + x * 4;
                modifiedPixels[i] = r;
                modifiedPixels[i + 1] = g;
                modifiedPixels[i + 2] = b;
            }
        }
    }

    applySharpen(imageData: ImageData) {
        const modifiedPixels = imageData.data;
        const originalPixels = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;

        const kernel: Int8Array = new Int8Array([
            0,
            -1,
            0,
            -1,
            5,
            -1,
            0,
            -1,
            0,
        ]);

        function redAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            return originalPixels[i];
        }

        function greenAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            return originalPixels[i + 1];
        }

        function blueAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            return originalPixels[i + 2];
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0;
                let g = 0;
                let b = 0;
                let x_k = -1;
                let y_k = -1;
                for (let k = 0; k < kernel.length; k++) {
                    r += kernel[k] * redAt(x + x_k, y + y_k);
                    g += kernel[k] * greenAt(x + x_k, y + y_k);
                    b += kernel[k] * blueAt(x + x_k, y + y_k);
                    if (++x_k > 1) {
                        x_k = -1;
                        y_k++;
                    }
                }
                const i = y * (width * 4) + x * 4;
                modifiedPixels[i] = r < 0 ? 0 : r > 255 ? 255 : r;
                modifiedPixels[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
                modifiedPixels[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
            }
        }
    }

    toGrayScale(imageData: ImageData) {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const gray =
                data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray; // red
            data[i + 1] = gray; // green
            data[i + 2] = gray; // blue
        }
    }

    // Altered version from: https://github.com/miguelmota/sobel
    applySobelEdgeFilter(imageData: ImageData) {
        const modifiedPixels = imageData.data;
        const originalPixels = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;

        const kernelX = new Int8Array([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
        const kernelY = new Int8Array([-1, -2, -1, 0, 0, 0, 1, 2, 1]);

        const edgePoints: Point[] = [];

        function pixelAt(x: number, y: number) {
            const i = y * (width * 4) + x * 4;
            return originalPixels[i];
        }

        const edgeNeglectDist = 10;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * (width * 4) + x * 4;
                if (
                    x - edgeNeglectDist < 0 ||
                    y - edgeNeglectDist < 0 ||
                    x > width - edgeNeglectDist ||
                    y > height - edgeNeglectDist
                ) {
                    modifiedPixels[i] = 0;
                    modifiedPixels[i + 1] = 0;
                    modifiedPixels[i + 2] = 0;
                    continue;
                }

                let gx = 0;
                let gy = 0;
                let x_k = -1;
                let y_k = -1;
                for (let k = 0; k < kernelX.length; k++) {
                    const pixelVal = pixelAt(x + x_k, y + y_k);
                    gx += kernelX[k] * pixelVal;
                    gy += kernelY[k] * pixelVal;
                    if (++x_k > 1) {
                        x_k = -1;
                        y_k++;
                    }
                }

                const gradientMagnitude = Math.sqrt(gx * gx + gy * gy);
                // const gradientDirection = (Math.atan(gy / gx) * 180) / Math.PI;

                // if (gradientMagnitude <= 22.5 || gradientMagnitude > 157.5) {

                // }

                // const threshold = 1442 * 0.5;
                const threshold = 1442 * 0.35;
                if (gradientMagnitude > threshold) {
                    modifiedPixels[i] = 255;
                    modifiedPixels[i + 1] = 255;
                    modifiedPixels[i + 2] = 255;
                    edgePoints.push(new Point(x, y));
                } else {
                    modifiedPixels[i] = 0;
                    modifiedPixels[i + 1] = 0;
                    modifiedPixels[i + 2] = 0;
                }
            }
        }

        return edgePoints;
    }

    detectBigColorDifferences(
        prevFrameData: ImageData,
        currFrameData: ImageData
    ) {
        const prevPixels = prevFrameData.data;
        const currPixels = currFrameData.data;

        const pixels: Point[] = [];

        let totalChange = 0;

        for (let y = 0; y < currFrameData.height; y++) {
            for (let x = 0; x < currFrameData.width; x++) {
                const i = y * (currFrameData.width * 4) + x * 4;
                const prevLab = convert.rgb.lab([
                    prevPixels[i],
                    prevPixels[i + 1],
                    prevPixels[i + 2],
                ]);
                const currLab = convert.rgb.lab([
                    currPixels[i],
                    currPixels[i + 1],
                    currPixels[i + 2],
                ]);
                const maxDiff = 40;
                const diff = deltaE.getDeltaE00(
                    {
                        L: prevLab[0],
                        A: prevLab[1],
                        B: prevLab[2],
                    },
                    {
                        L: currLab[0],
                        A: currLab[1],
                        B: currLab[2],
                    }
                );
                if (diff > maxDiff) {
                    pixels.push(new Point(x, y));
                }
                totalChange += diff;
            }
        }
        console.log("Avg color dist: " + totalChange / (prevPixels.length / 4));
        return pixels;
    }

    pointsToImgData(points: Point[], width: number, height: number) {
        const imgData = new ImageData(width, height);
        const pixels = imgData.data;
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const j = p.y * (width * 4) + p.x * 4;
            pixels[j] = 255;
            pixels[j + 1] = 255;
            pixels[j + 1] = 255;
        }
        return imgData;
    }

    maartensRareAlgoritme(
        prevFrameData: ImageData,
        currFrameData: ImageData,
        arrayToPushTo: Point[]
    ) {
        const prevPixels = prevFrameData.data;
        const currPixels = currFrameData.data;
        const prevGrayData = new ImageData(
            prevFrameData.width,
            prevFrameData.height
        );
        prevGrayData.data.set(prevPixels);
        this.toGrayScale(prevGrayData);
        const prevGrayPixels = prevGrayData.data;
        const currGrayData = new ImageData(
            currFrameData.width,
            currFrameData.height
        );

        currGrayData.data.set(currPixels);
        this.toGrayScale(currGrayData);
        const currGrayPixels = currGrayData.data;

        const pixels: Point[] = [];

        for (let i = 0; i < currPixels.length; i += 4) {
            const maxRgbDiff = 50;
            const rDiff = Math.abs(currPixels[i] - prevPixels[i]);
            const gDiff = Math.abs(currPixels[i + 1] - prevPixels[i + 1]);
            const bDiff = Math.abs(currPixels[i + 2] - prevPixels[i + 2]);

            const bnwDiff = Math.abs(currGrayPixels[i] - prevGrayPixels[i]);

            const currHsl = convert.rgb.hsl([
                currPixels[i],
                currPixels[i + 1],
                currPixels[i + 2],
            ]);
            const isCorrectColor =
                currHsl[0] >= 180 &&
                currHsl[0] <= 260 &&
                currHsl[2] >= 30 &&
                currHsl[2] <= 70;

            if (
                (bnwDiff >= 75 ||
                    rDiff > maxRgbDiff ||
                    gDiff > maxRgbDiff ||
                    bDiff > maxRgbDiff) &&
                isCorrectColor
            ) {
                const x = (i / 4) % currFrameData.width;
                const y = Math.floor(i / 4 / currFrameData.width);
                pixels.push(new Point(x, y));
                arrayToPushTo.push(new Point(x, y));
            }
        }

        return pixels;
    }

    filter8Neighbors(
        pixelsToFilter: Point[],
        imgData: ImageData,
        threshold: number
    ) {
        const pixels = imgData.data;

        const filteredPoints: Point[] = [];

        for (let p = 0; p < pixelsToFilter.length; p++) {
            const point = pixelsToFilter[p];
            let neighborCount = 0;
            const leftIndex = point.y * (imgData.width * 4) + (point.x - 1) * 4;
            const topLeftIndex =
                (point.y - 1) * (imgData.width * 4) + (point.x - 1) * 4;
            const topIndex = (point.y - 1) * (imgData.width * 4) + point.x * 4;
            const topRightIndex =
                (point.y - 1) * (imgData.width * 4) + (point.x + 1) * 4;
            const rightIndex =
                point.y * (imgData.width * 4) + (point.x + 1) * 4;
            const bottomRightIndex =
                (point.y + 1) * (imgData.width * 4) + (point.x + 1) * 4;
            const bottomIndex =
                (point.y + 1) * (imgData.width * 4) + point.x * 4;
            const bottomLeftIndex =
                (point.y + 1) * (imgData.width * 4) + (point.x - 1) * 4;
            if (pixels[leftIndex] == 255) neighborCount++;
            if (pixels[topLeftIndex] == 255) neighborCount++;
            if (pixels[topIndex] == 255) neighborCount++;
            if (pixels[topRightIndex] == 255) neighborCount++;
            if (pixels[rightIndex] == 255) neighborCount++;
            if (pixels[bottomRightIndex] == 255) neighborCount++;
            if (pixels[bottomIndex] == 255) neighborCount++;
            if (pixels[bottomLeftIndex] == 255) neighborCount++;

            if (neighborCount >= threshold) {
                filteredPoints.push(point);
            }
        }

        return filteredPoints;
    }

    filterToAreas(edgePoints: Point[]): Array<Point[]> {
        if (edgePoints.length == 0) return [];

        const sweepWidth = 1;

        const xSortedPoints = edgePoints.sort((a, b) => a.x - b.x);
        const xAreas: Array<Point[]> = [[xSortedPoints[0]]];
        for (let i = 1; i < xSortedPoints.length; i++) {
            const point = xSortedPoints[i];
            const lastArea = xAreas[xAreas.length - 1];
            const lastPointInArea = lastArea[lastArea.length - 1];
            if (point.x - lastPointInArea.x <= sweepWidth) {
                lastArea.push(point);
            } else {
                xAreas.push([point]);
            }
        }

        const areas: Array<Point[]> = [];
        for (let i = 0; i < xAreas.length; i++) {
            const sortedYInArea = xAreas[i].sort((a, b) => a.y - b.y);
            for (let j = 0; j < sortedYInArea.length; j++) {
                const point = sortedYInArea[j];
                if (j == 0) {
                    areas.push([point]);
                    continue;
                }
                const lastArea = areas[areas.length - 1];
                const lastPointInArea = lastArea[lastArea.length - 1];
                if (point.y - lastPointInArea.y <= sweepWidth) {
                    lastArea.push(point);
                } else {
                    areas.push([point]);
                }
            }
        }

        return areas;
    }

    findEdgesByColorChanges(center: Point, imgData: ImageData) {
        const pixels = imgData.data;
        const edgePoints: Point[] = [];
        const step = 1;
        const colorThreshold = 7;
        const centerI = center.y * (imgData.width * 4) + center.x * 4;
        for (let deg = 0; deg < 360; deg += 1) {
            const rads = (deg * Math.PI) / 180;
            let searchingColorChange = true;
            let dist = step;
            let prevColor = convert.rgb.lab([
                pixels[centerI],
                pixels[centerI + 1],
                pixels[centerI + 2],
            ]);
            while (searchingColorChange) {
                const x = Math.round(center.x + dist * Math.cos(rads));
                const y = Math.round(center.y + dist * Math.sin(rads));
                if (
                    x >= imgData.width ||
                    y >= imgData.height ||
                    x < 0 ||
                    y < 0
                ) {
                    break;
                }
                const point = new Point(x, y);
                const i = y * (imgData.width * 4) + x * 4;
                const color = convert.rgb.lab([
                    pixels[i],
                    pixels[i + 1],
                    pixels[i + 2],
                ]);
                const colorDiff = deltaE.getDeltaE00(
                    { L: prevColor[0], A: prevColor[1], B: prevColor[2] },
                    { L: color[0], A: color[1], B: color[2] }
                );
                if (colorDiff > colorThreshold) {
                    edgePoints.push(point);
                    searchingColorChange = false;
                } else {
                    prevColor = color;
                    dist += step;
                }
            }
        }
        return edgePoints;
    }

    getAreasOfInterestAroundCorners(
        edgePoints: Point[],
        corners: Point[],
        maxRangesPerCorner: number[]
    ) {
        const filtered: Array<Point[]> = [];
        for (let i = 0; i < corners.length; i++) {
            filtered.push([]);
        }
        for (let i = 0; i < edgePoints.length; i++) {
            const p = edgePoints[i];
            for (let j = 0; j < corners.length; j++) {
                const corner = corners[j];
                const maxDist = maxRangesPerCorner[j];
                if (p.distanceTo(corner) <= maxDist) {
                    filtered[j].push(p);
                }
            }
        }
        return filtered;
    }

    findCornersInPOI(previousCenter: Point, cornerAreas: Array<Point[]>) {
        const corners: Point[] = [];
        cornerAreas.forEach((area) => {
            let maxDist = 0;
            let point: Point;
            area.forEach((p) => {
                const dist = p.distanceSq(previousCenter);
                if (dist > maxDist) {
                    maxDist = dist;
                    point = p;
                }
            });
            if (point) {
                corners.push(point);
            }
        });
        return corners;
    }
}
