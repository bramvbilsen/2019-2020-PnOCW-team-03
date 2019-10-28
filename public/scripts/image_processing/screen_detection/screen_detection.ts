import convexHull from "./hull";
import Point from "./Point";
import Line from "./Line";

interface IHSLColor {
	h: number;
	s: number;
	l: number;
}

interface IPixels {
	get: (x: number, y: number, colorChannel: number) => number;
	shape: any[]
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

function dowloadResult(path: string) {
	const downloadLink = document.createElement("a");
	downloadLink.href = path;
	downloadLink.download = "result.png";

	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}

const getPixels = (path: string): Promise<IPixels> => {
	return new Promise((resolve, reject) => {
		require("get-pixels")(path, (err: any, pixels: IPixels) => {
			if (err) {
				reject(err);
			} else {
				resolve(pixels);
			}
		});
	});
};

export default async function findScreen(color: IHSLColor, imagePath: string) {
	const t0 = new Date();

	const originalImage = await loadImage(imagePath);
	const width = originalImage.width;
	const height = originalImage.height;

	// FILTER OUT UNWANTED COLORS
	const colorFilteredCanvas = removeColor(color, originalImage);
	// ----------------

	// MAKE A SCALED UP VERSION
	const nonShiftedImg = await loadImage(colorFilteredCanvas.toDataURL());
	const shiftSize = 1;
	const shiftedImgCanvas = scaleUpImage(shiftSize, nonShiftedImg);

	// ----------------

	// GENERATE ROUGH EDGES
	const shiftedImage = await loadImage(shiftedImgCanvas.toDataURL());
	const roughEdgeCanvas = generateEdges(nonShiftedImg, shiftedImage);
	// ----------------

	// DETERMINE POSSIBLE BORDER POINTS
	let borderPoints = await getPossibleBordersPoints(
		roughEdgeCanvas.toDataURL(),
		color
	);
	// ----------------

	// REDUCE NOISE CLOSE TO EACH OTHER
	const nonShiftedImgPixels = await getPixels(
		colorFilteredCanvas.toDataURL()
	);
	borderPoints = reduceNearbyPixelNoise(
		borderPoints,
		nonShiftedImgPixels,
		color
	);
	// ----------------

	// // REDUCE NOISE FAR FROM EACH OTHER
	borderPoints = reduceLongDistancePixelNoise(
		borderPoints,
		nonShiftedImgPixels,
		color
	);
	// ----------------

	// // FIND POSSIBLE CORNERS
	const possibleCorners = convexHull(borderPoints);
	// // ----------------

	// // CONNECT ALL POSSIBLE CORNERS
	const possibleCornersConnections = createPossibleCornerConnections(
		possibleCorners
	);
	// ----------------

	// FILTER CONNECTIONS AND SEARCH THE TWO CONTAINING THE 4 CORNERS
	const [firstCornerConnection, secondCornerConnection] = findFinalCorners(
		possibleCornersConnections
	);
	if (!secondCornerConnection) {
		console.log("No 4 corners found!");
		return;
	}
	// ----------------

	const t1 = new Date();
	console.log(+t1 - +t0 + "ms");

	const finalCanvas = drawResultPoints(
		width,
		height,
		[
			...firstCornerConnection.endPoints,
			...secondCornerConnection.endPoints
		],
		"CIRC",
		30,
		"rgb(0, 255, 255)",
		originalImage
	);
	dowloadResult(finalCanvas.toDataURL());
	return finalCanvas;
}

function checkNeighboringPixelsHaveColor(
	pixels: any,
	searchRange: number,
	x: number,
	y: number,
	width: number,
	height: number,
	hslColor: IHSLColor,
	minAmtOfPositives: number
) {
	return (
		amountOfNeighboringPixelsWithColor(
			pixels,
			searchRange,
			x,
			y,
			width,
			height,
			hslColor
		) >= minAmtOfPositives
	);
}

function amountOfNeighboringPixelsWithColor(
	pixels: any,
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
			isSimilarHSLColor(getHSLColor(pixels, x - range, y), hslColor)
		) {
			result++;
		}
		if (
			y > range &&
			isSimilarHSLColor(getHSLColor(pixels, x, y - range), hslColor)
		) {
			result++;
		}
		if (
			x < width - range &&
			isSimilarHSLColor(getHSLColor(pixels, x + range, y), hslColor)
		) {
			result++;
		}
		if (
			y < height - range &&
			isSimilarHSLColor(getHSLColor(pixels, x, y + range), hslColor)
		) {
			result++;
		}
		if (
			x > range &&
			y > range &&
			isSimilarHSLColor(
				getHSLColor(pixels, x - range, y - range),
				hslColor
			)
		) {
			result++;
		}
		if (
			x < width - range &&
			y > range &&
			isSimilarHSLColor(
				getHSLColor(pixels, x + range, y - range),
				hslColor
			)
		) {
			result++;
		}
		if (
			x > range &&
			y < height - range &&
			isSimilarHSLColor(
				getHSLColor(pixels, x - range, y + range),
				hslColor
			)
		) {
			result++;
		}
		if (
			x < width - range &&
			y < height - range &&
			isSimilarHSLColor(
				getHSLColor(pixels, x + range, y + range),
				hslColor
			)
		) {
			result++;
		}
	}

	return result;
}

function getHSLColor(pixels: any, x: number, y: number): IHSLColor {
	const [h, s, l] = rgbToHsl(
		pixels.get(x, y, 0),
		pixels.get(x, y, 1),
		pixels.get(x, y, 2)
	);
	return {
		h,
		s,
		l
	};
}

function isSimilarHSLColor(colorA: IHSLColor, colorB: IHSLColor): boolean {
	if (
		Math.abs(colorA.h - colorB.h) <= 25 &&
		Math.abs(colorA.s - colorB.s) <= 45 &&
		Math.abs(colorA.l - colorB.l) <= 45
	) {
		return true;
	}
	return false;
}

// From: https://gist.github.com/mjackson/5311256
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	(r /= 255), (g /= 255), (b /= 255);
	let max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h,
		s,
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
	return [h * 360, s * 100, l * 100];
}

// Information by: https://stackoverflow.com/questions/7348618/html5-canvas-clipping-by-color
function removeColor(color: IHSLColor, image: Image) {
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");

	ctx.drawImage(image, 0, 0, image.width, image.height);

	var canvasData = ctx.getImageData(0, 0, image.width, image.height),
		canvasPixels = canvasData.data;

	for (var i = 0, n = canvasPixels.length; i < n; i += 4) {
		const [h, s, l] = rgbToHsl(
			canvasPixels[i],
			canvasPixels[i + 1],
			canvasPixels[i + 2]
		);
		if (!isSimilarHSLColor(color, { h, s, l })) {
			canvasPixels[i + 3] = 0; // set opacity to 0.
		}
	}

	ctx.putImageData(canvasData, 0, 0);
	return canvas;
}

function scaleUpImage(shiftSize: number, image: Image) {
	const width = image.width,
		height = image.height;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	// shift right
	ctx.drawImage(image, shiftSize, 0, width, height);
	// shift left
	ctx.drawImage(image, -shiftSize, 0, width, height);
	// shift up
	ctx.drawImage(image, 0, -shiftSize, width, height);
	// shift down
	ctx.drawImage(image, 0, shiftSize, width, height);
	// shift right & up
	ctx.drawImage(image, shiftSize, -shiftSize, width, height);
	// shift left & up
	ctx.drawImage(image, -shiftSize, -shiftSize, width, height);
	// shift right & down
	ctx.drawImage(image, shiftSize, shiftSize, width, height);
	// shift left & down
	ctx.drawImage(image, -shiftSize, shiftSize, width, height);

	return canvas;
}

function generateEdges(image: Image, scaledUpImage: Image) {
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");
	ctx.globalCompositeOperation = "xor";
	ctx.drawImage(image, 0, 0, image.width, image.height);
	ctx.drawImage(
		scaledUpImage,
		0,
		0,
		scaledUpImage.width,
		scaledUpImage.height
	);
	return canvas;
}

async function getPossibleBordersPoints(imagePath: string, color: IHSLColor) {
	const roughEdgePixels = await getPixels(imagePath);
	const width = roughEdgePixels.shape[0];
	const height = roughEdgePixels.shape[1];
	/** @type {Point[]} */
	let borderPoints = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let putRect = false;
			// Borderpoints should have at least one neighboring pixel with color
			if (
				checkNeighboringPixelsHaveColor(
					roughEdgePixels,
					1,
					x,
					y,
					width,
					height,
					color,
					1
				)
			) {
				putRect = true;
			}

			if (putRect) {
				borderPoints.push(new Point(x, y));
			}
		}
	}
	return borderPoints;
}

/**
 *
 * @param {Point[]} pixelPoints
 * @returns {Point[]}
 */
function reduceNearbyPixelNoise(pixelPoints: Point[], pixels: any, color: IHSLColor) {
	const width = pixels.shape[0];
	const height = pixels.shape[1];
	const points: Point[] = [];
	pixelPoints.forEach(point => {
		// If 8*2.25 of the 8*3 nearest neighbors are colored.
		if (
			amountOfNeighboringPixelsWithColor(
				pixels,
				3,
				point.x,
				point.y,
				width,
				height,
				color
			) >
			8 * 2
		) {
			points.push(point);
		} else {
		}
	});
	return points;
}

/**
 *
 * @param {Point[]} pixelPoints
 * @returns {Point[]}
 */
function reduceLongDistancePixelNoise(pixelPoints: Point[], pixels: any, color: IHSLColor) {
	const width = pixels.shape[0];
	const height = pixels.shape[1];
	const points: Point[] = [];
	pixelPoints.forEach(point => {
		// If 8*2.25 of the 8*3 nearest neighbors are colored.
		if (
			amountOfNeighboringPixelsWithColor(
				pixels,
				15,
				point.x,
				point.y,
				width,
				height,
				color
			) >
			8 * 6
		) {
			points.push(point);
		} else {
		}
	});
	return points;
}

/**
 *
 * @param {Point[]} corners
 * @returns {Line[]}
 */
function createPossibleCornerConnections(corners: Point[]) {
	const connections: Line[] = [];
	corners.forEach((corner, index) => {
		for (let i = index; i < corners.length; i++) {
			connections.push(new Line(corner, corners[i]));
		}
	});
	return connections;
}

/**
 *
 * @param {Line[]} cornerConnections
 */
function findFinalCorners(cornerConnections: Line[]) {
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
	return [firstCornerConnection, secondCornerConnection];
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @param {Point[]} points
 * @param {"RECT" | "CIRC"} type
 * @param {number} size
 * @param {string} color - optional
 * @param {Image} backgroundImg - optional
 */
function drawResultPoints(
	width: number,
	height: number,
	points: Point[],
	type: "RECT" | "CIRC",
	size: number,
	color: string,
	backgroundImg: Image
) {
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");
	if (backgroundImg) {
		ctx.drawImage(backgroundImg, 0, 0, width, height);
	}
	if (color) {
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
	} else {
		ctx.fillStyle = "rgb(0, 255, 255)";
		ctx.strokeStyle = "rgb(0, 255, 255)";
	}
	points.forEach(point => {
		if (type === "RECT") {
			ctx.fillRect(point.x, point.y, size, size);
		} else {
			ctx.beginPath();
			ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
			if (color) {
				ctx.fill();
			}
			ctx.stroke();
			ctx.closePath();
		}
	});
	return canvas;
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
