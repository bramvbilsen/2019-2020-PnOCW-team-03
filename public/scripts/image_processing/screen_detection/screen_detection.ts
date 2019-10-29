import Point from "./Point";
import Line from "./Line";
import convexHull from "./hull";

interface IHSLColor {
	h: number;
	s: number;
	l: number;
}

interface IRGBAColor {
	r: number;
	g: number;
	b: number;
	a: number;
}

interface IHSLRange { hRange: number, sRange: number, lRange: number }

const similarPinkRange: IHSLRange = {
	hRange: 30, sRange: 30, lRange: 30
}

const randomColorRange: IHSLRange = {
	hRange: 50, sRange: 50, lRange: 50
}

let currentStep = 0;

document.onkeypress = e => {
	currentStep++;
	console.log("new step");
}

const wait = async (ms: number) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, ms)
	});
}

export default async function findScreen(nonColoredImgPath: string, coloredImgPath: string, screenColorRGBA: IRGBAColor, DEBUG = false) {

	const screenColorHSL: IHSLColor = rgbToHsl(screenColorRGBA.r, screenColorRGBA.g, screenColorRGBA.b);

	const t0 = new Date();
	const LOST_PIXEL_SEARCH_RANGE = 10;
	const LOST_PIXEL_THRESHOLD = (8 * LOST_PIXEL_SEARCH_RANGE) * 0.24;

	const nonColoredScreenImg = await loadImage(nonColoredImgPath);
	const coloredScreenImg = await loadImage(coloredImgPath);

	const width = nonColoredScreenImg.width;
	const height = nonColoredScreenImg.height;

	const jQueryBody: JQuery<HTMLBodyElement> = $("body");
	jQueryBody.append($(`<canvas width=${width} height=${height}></canvas>`));

	const jQueryCanvas: JQuery<HTMLCanvasElement> = $("canvas");
	const ctx = jQueryCanvas[0].getContext("2d");
	ctx.drawImage(nonColoredScreenImg, 0, 0);

	while (DEBUG && currentStep !== 1) {
		await wait(250);
	}

	const nonColoredScreenCanvas = createCanvas(width, height);
	const nonColoredScreenCtx = <CanvasRenderingContext2D>nonColoredScreenCanvas.getContext("2d");
	nonColoredScreenCtx.drawImage(nonColoredScreenImg, 0, 0);
	const nonColoredScreenPixelData = nonColoredScreenCtx.getImageData(
		0,
		0,
		width,
		height
	),
		nonColoredScreenPixels = nonColoredScreenPixelData.data;

	const coloredScreenCanvas = createCanvas(width, height);
	const coloredScreenCtx = <CanvasRenderingContext2D>coloredScreenCanvas.getContext("2d");
	coloredScreenCtx.drawImage(coloredScreenImg, 0, 0);
	const coloredScreenPixelData = coloredScreenCtx.getImageData(
		0,
		0,
		width,
		height
	),
		coloredScreenPixels = coloredScreenPixelData.data;

	const resultingScreenCanvas = createCanvas(width, height);
	const resultingScreenCtx = <CanvasRenderingContext2D>resultingScreenCanvas.getContext("2d");
	resultingScreenCtx.fillStyle = "rgb(0, 0, 0)";
	resultingScreenCtx.fillRect(0, 0, width, height);
	const resultingScreenImageData = resultingScreenCtx.getImageData(
		0,
		0,
		width,
		height
	), resultingPixels = resultingScreenImageData.data;

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
			if (!isSimilarHSLColor(noScreenColor, screenColor, randomColorRange) && isSimilarHSLColor(screenColorHSL, screenColor, similarPinkRange)) {
				resultingPixels[linearizedIndex] = screenColorRGBA.r;
				resultingPixels[linearizedIndex + 1] = screenColorRGBA.g;
				resultingPixels[linearizedIndex + 2] = screenColorRGBA.b;
				possibleCorners.push(new Point(x, y));

			} else {
				resultingPixels[linearizedIndex] = 0;
				resultingPixels[linearizedIndex + 1] = 0;
				resultingPixels[linearizedIndex + 2] = 0;
			}
		}
	}

	if (DEBUG) {
		resultingScreenCtx.putImageData(resultingScreenImageData, 0, 0);
		jQueryCanvas[0].getContext("2d").drawImage(resultingScreenCanvas, 0, 0);

		while (currentStep !== 2) {
			await wait(250);
		}
	}

	possibleCorners = possibleCorners.filter(point => {
		const linearizedIndex = (width * point.y + point.x) * 4;
		// Corners will have on average 25 percent colored neighbors. Delete all pixels who do not meet this. 
		if (amountOfNeighboringPixelsWithColor(resultingPixels, LOST_PIXEL_SEARCH_RANGE, point.x, point.y, width, height, screenColorHSL) < LOST_PIXEL_THRESHOLD) {
			resultingPixels[linearizedIndex] = 0;
			resultingPixels[linearizedIndex + 1] = 0;
			resultingPixels[linearizedIndex + 2] = 0;
			return false;
		}
		resultingPixels[linearizedIndex] = screenColorRGBA.r;
		resultingPixels[linearizedIndex + 1] = screenColorRGBA.g;
		resultingPixels[linearizedIndex + 2] = screenColorRGBA.b;
		return true;
	});

	possibleCorners = convexHull(possibleCorners);

	if (DEBUG) {
		resultingScreenCtx.putImageData(resultingScreenImageData, 0, 0);
		jQueryCanvas[0].getContext("2d").drawImage(resultingScreenCanvas, 0, 0);

		while (currentStep !== 3) {
			await wait(250);
		}
	}

	const possibleCornerConnections = createConnections(possibleCorners);

	if (DEBUG) {
		jQueryCanvas[0].getContext("2d").drawImage(drawResultLines(width, height, possibleCornerConnections, 5), 0, 0);
		while (currentStep !== 4) {
			await wait(250);
		}
	}

	const corners = findFinalCorners(possibleCornerConnections);

	jQueryCanvas[0].getContext("2d").drawImage(nonColoredScreenImg, 0, 0);
	ctx.fillStyle = "rgb(0, 255, 255)";
	corners.forEach(corner => {
		ctx.beginPath();
		ctx.arc(corner.x, corner.y, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	});

	const t1 = new Date();
	console.log(+t1 - +t0 + "ms");
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

function createCanvas(width: number, height: number): HTMLCanvasElement {
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
function getRGBAColorForPixel(x: number, y: number, width: number, pixels: Uint8ClampedArray): IRGBAColor {
	const i = y * (width * 4) + x * 4;
	return {
		r: pixels[i],
		g: pixels[i + 1],
		b: pixels[i + 2],
		a: pixels[i + 3]
	}
}

function getHSLColorForPixel(x: number, y: number, width: number, pixels: Uint8ClampedArray): IHSLColor {
	const rgba = getRGBAColorForPixel(x, y, width, pixels);
	return rgbToHsl(rgba.r, rgba.g, rgba.b);
}

function isSimilarHSLColor(colorA: IHSLColor, colorB: IHSLColor, params: IHSLRange): boolean {
	if (
		Math.abs(colorA.h - colorB.h) <= params.hRange &&
		Math.abs(colorA.s - colorB.s) <= params.sRange &&
		Math.abs(colorA.l - colorB.l) <= params.lRange
	) {
		return true;
	}
	return false;
}

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
			isSimilarHSLColor(getHSLColorForPixel(x - range, y, width, pixels), hslColor, similarPinkRange)
		) {
			result++;
		}
		if (
			y > range &&
			isSimilarHSLColor(getHSLColorForPixel(x, y - range, width, pixels), hslColor, similarPinkRange)
		) {
			result++;
		}
		if (
			x < width - range &&
			isSimilarHSLColor(getHSLColorForPixel(x + range, y, width, pixels), hslColor, similarPinkRange)
		) {
			result++;
		}
		if (
			y < height - range &&
			isSimilarHSLColor(getHSLColorForPixel(x, y + range, width, pixels), hslColor, similarPinkRange)
		) {
			result++;
		}
		if (
			x > range &&
			y > range &&
			isSimilarHSLColor(
				getHSLColorForPixel(x - range, y - range, width, pixels),
				hslColor, similarPinkRange
			)
		) {
			result++;
		}
		if (
			x < width - range &&
			y > range &&
			isSimilarHSLColor(
				getHSLColorForPixel(x + range, y - range, width, pixels),
				hslColor, similarPinkRange
			)
		) {
			result++;
		}
		if (
			x > range &&
			y < height - range &&
			isSimilarHSLColor(
				getHSLColorForPixel(x - range, y + range, width, pixels),
				hslColor, similarPinkRange
			)
		) {
			result++;
		}
		if (
			x < width - range &&
			y < height - range &&
			isSimilarHSLColor(
				getHSLColorForPixel(x + range, y + range, width, pixels),
				hslColor, similarPinkRange
			)
		) {
			result++;
		}
	}

	return result;
}

function createConnections(points: Point[]) {
	const connections: Line[] = [];
	points.forEach((corner, index) => {
		for (let i = index; i < points.length; i++) {
			connections.push(new Line(corner, points[i]));
		}
	});
	return connections;
}

function findFinalCorners(cornerConnections: Line[]): Point[] {
	if (cornerConnections.length === 0) return [];
	const sortedPossibleCornersConnections = cornerConnections.sort(
		(connectionA, connectionB) => connectionB.length - connectionA.length
	);

	const minDistanceBetweenCorners = 100;
	const firstCornerConnection = sortedPossibleCornersConnections[0];
	let secondCornerConnection;
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
	if (!secondCornerConnection) return [firstCornerConnection.a, firstCornerConnection.b];
	return [firstCornerConnection.a, firstCornerConnection.b, secondCornerConnection.a, secondCornerConnection.b];
}

function drawResultLines(width: number, height: number, lines: Line[], pointSize: number) {
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
