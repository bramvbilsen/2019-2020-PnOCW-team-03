/**
 * Initializing constants
 * 
 */

const colorRange: IHSLRange = {
    hRange: 35,
    sRange: 60,
    lRange: 60
};
const leftUpperColor: IHSLColor = rgbToHsl(
    255,
    70,
    180
);
const rightUpperColor: IHSLColor = rgbToHsl(
    255,
    216,
    0
);
const rightUnderColor: IHSLColor = rgbToHsl(
    12,
    0,
    255
);
const leftUnderColor: IHSLColor = rgbToHsl(
    0,
    255,
    25
);
const colors = [leftUpperColor, rightUpperColor, rightUnderColor, leftUnderColor];

/**
 * Defining imported functions and interfaces
 * 
 */

interface IPixels {
	get: (x: number, y: number, colorChannel: number) => number;
	shape: any[]
}

const getPixels = (path: string): Promise<IPixels> => {
	return new Promise((resolve, reject) => {
        // @ts-ignore
		require("get-pixels")(path, (err: any, pixels: IPixels) => {
			if (err) {
				reject(err);
			} else {
				resolve(pixels);
			}
		});
	});
};

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


function amountOfNeighboringPixelsWithColor(
    pixels: IPixels,
    searchRange: number,
    x: number,
    y: number,
    width: number,
    height: number,
    hslColor: IHSLColor,
    colorRange: IHSLRange
) {
    //console.log(x,y,width, height, searchRange, hslColor, colorRange)
    let result = 0;
    if (searchRange <= 0) return result;

    for (let range = 1; range <= searchRange; range++) {
        if (
            x >= range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x - range, y, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            y >= range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x, y - range, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            x < width - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x + range, y, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            y < height - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x, y + range, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            x >= range &&
            y >= range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x - range, y - range, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            x < width - range &&
            y >= range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x + range, y - range, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            x >= range &&
            y < height - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x - range, y + range, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
        if (
            x < width - range &&
            y < height - range &&
            isSimilarHSLColor(
                getHSLColorForPixel(x + range, y + range, pixels),
                hslColor,
                colorRange
            )
        ) {
            result++;
        }
    }
    return result;
}

function getHSLColorForPixel(
    x: number,
    y: number,
    pixels: IPixels
): IHSLColor {
    const rgba = getRGBAColorForPixel(x, y, pixels);
    return rgbToHsl(rgba.r, rgba.g, rgba.b);
}

function getRGBAColorForPixel(
    x: number,
    y: number,
    pixels: IPixels
): IRGBAColor {
    //const i = y * (width * 4) + x * 4;
    return {
        r:  pixels.get(x,y,0),
        g:  pixels.get(x,y,1),
        b:  pixels.get(x,y,2),
        a:  pixels.get(x,y,3)
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

/**
 * 1) Get screen_centroid
 * 2) Get 4 centroids
 * 3) Get color for each centroid
 * 
 * @param points List of points representing the 4 corner-points to get the centroid for.
 */
async function main(points: Point[], path: string): Promise<void> {
    const centroids = getAllCentroids(points);
    console.log(centroids);
    const angle = getAngle(points[0], points[1], points[2], points[3]);
    var pixels = await getPixels(path);
    getOrientation(centroids, pixels, angle);

}

main([new Point(341,283), new Point(650,280),new Point(646,498),new Point(350,506)], "../../../img/test2.png")




/**
 * Label all the corners
 */
function cornerLabeling(p1: Point, p2: Point, p3: Point, p4: Point) {
    var corners = [p1, p2, p3, p4]
    var sums = []
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    var rightUnderIndex, leftUpperIndex;
    var rightUpperCoordinate: Point, leftUnderCoordinate: Point, leftUpperCoordinate: Point, rightUnderCoordinate: Point;

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

    return { "LeftUp": leftUpperCoordinate, "RightUp": rightUpperCoordinate, "RightUnder": rightUnderCoordinate, "LeftUnder": leftUnderCoordinate };
}

function getAngle(p1: Point, p2: Point, p3: Point, p4: Point) {
	var labeledCorners = cornerLabeling(p1, p2, p3, p4);
	var left = labeledCorners["LeftUp"];
	var right = labeledCorners["RightUp"];
	var origin = left;
	var vector1 = new Point(right.x-origin.x,left.y-origin.y);
	var vector2 = new Point (right.x-origin.x, right.y-origin.y);
	var radians = Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);
	return radians * (180/Math.PI);
}

function getAllCentroids(points: Point[]): {[key: string]: Point} {
    /**
     * Get the centroid (center point) of the 4 given corner points.
     * 
     * @param points List of points representing the 4 corner-points to get the centroid for.
     */
    function getCentroidOf(points: Point[]): Point {
        var sumX = 0;
        var sumY = 0;
        points.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        });
        return new Point(Math.round(sumX / points.length), Math.round(sumY / points.length));
    }

    const labeledCorners = cornerLabeling(points[0], points[1], points[2], points[3]);
    const leftUpper = labeledCorners["LeftUp"];
    const rightUpper = labeledCorners["RightUp"];
    const leftUnder = labeledCorners["LeftUnder"];
    const rightUnder = labeledCorners["RightUnder"];
    const upperMiddle = new Point((rightUpper.x + leftUpper.x) / 2, (rightUpper.y + leftUpper.y) / 2);
    const lowerMiddle = new Point((rightUnder.x + leftUnder.x) / 2, (rightUnder.y + leftUnder.y) / 2);
    const leftMiddle = new Point((leftUpper.x + leftUnder.x) / 2, (leftUpper.y + leftUnder.y) / 2);
    const rightMiddle = new Point((rightUnder.x + rightUpper.x) / 2, (rightUnder.y + rightUpper.y) / 2);

    const centroid = getCentroidOf(points);
    const centroid1 = getCentroidOf([leftUpper, upperMiddle, leftMiddle, centroid]);
    const centroid2 = getCentroidOf([upperMiddle, rightUpper, centroid, rightMiddle]);
    const centroid3 = getCentroidOf([leftMiddle, centroid, leftUnder, lowerMiddle]);
    const centroid4 = getCentroidOf([centroid, rightMiddle, lowerMiddle, rightUnder]);

    return {"0": centroid1, "1": centroid2, "3": centroid3, "2": centroid4};
}

function checkColor(centroid: Point, pixels: IPixels, key: string) {
    const RANGE = 3;
    const THRESHOLD = 18;
    for (var i = 0; i<colors.length; i++) {
        if (amountOfNeighboringPixelsWithColor(pixels, RANGE, centroid.x, centroid.y, pixels.shape[0], pixels.shape[1], colors[i], colorRange) > THRESHOLD) {
            const orientationNumber = parseInt(key) - i;
            if (orientationNumber == 1 || orientationNumber == -3) {
                return("rotated to the right right at an angle of: ")
            }
            if (orientationNumber == -2 || orientationNumber == 2) {
                return("Upside down, at an angle of: ")
            }
            if (orientationNumber == 0 ) {
                return("Standard orientation at an angle of: ")
            }
            if (orientationNumber == -1 || orientationNumber == 3) {
                return("rotated to the left at an angle of: ")
            }
        }
    }
    return("no orientation detected")

    
}

function getOrientation(centroids: {[key: string]: Point;}, pixels: IPixels, angle: number) {
    var centroid: Point;
    for (var key in centroids) {
        centroid = centroids[key];
        console.log(checkColor(centroid, pixels, key), angle, " degrees");
        //console.log(key)
        // your code here...
        
    }
}

