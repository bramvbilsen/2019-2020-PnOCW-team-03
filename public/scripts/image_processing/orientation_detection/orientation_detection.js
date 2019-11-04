"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var orientations_1 = require("./orientations");
/**
 * Initializing constants
 *
 */
var colorRange = {
    hRange: 35,
    sRange: 60,
    lRange: 60
};
var leftUpperColor = rgbToHsl(255, 70, 180);
var rightUpperColor = rgbToHsl(255, 216, 0);
var rightUnderColor = rgbToHsl(12, 0, 255);
var leftUnderColor = rgbToHsl(0, 255, 25);
var colors = [leftUpperColor, rightUpperColor, rightUnderColor, leftUnderColor];
var getPixels = function (path) {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        require("get-pixels")(path, function (err, pixels) {
            if (err) {
                reject(err);
            }
            else {
                resolve(pixels);
            }
        });
    });
};
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.distanceTo = function (point) {
        return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
    };
    return Point;
}());
function amountOfNeighboringPixelsWithColor(pixels, searchRange, x, y, width, height, hslColor, colorRange) {
    //console.log(x,y,width, height, searchRange, hslColor, colorRange)
    var result = 0;
    if (searchRange <= 0)
        return result;
    for (var range = 1; range <= searchRange; range++) {
        if (x >= range &&
            isSimilarHSLColor(getHSLColorForPixel(x - range, y, pixels), hslColor, colorRange)) {
            result++;
        }
        if (y >= range &&
            isSimilarHSLColor(getHSLColorForPixel(x, y - range, pixels), hslColor, colorRange)) {
            result++;
        }
        if (x < width - range &&
            isSimilarHSLColor(getHSLColorForPixel(x + range, y, pixels), hslColor, colorRange)) {
            result++;
        }
        if (y < height - range &&
            isSimilarHSLColor(getHSLColorForPixel(x, y + range, pixels), hslColor, colorRange)) {
            result++;
        }
        if (x >= range &&
            y >= range &&
            isSimilarHSLColor(getHSLColorForPixel(x - range, y - range, pixels), hslColor, colorRange)) {
            result++;
        }
        if (x < width - range &&
            y >= range &&
            isSimilarHSLColor(getHSLColorForPixel(x + range, y - range, pixels), hslColor, colorRange)) {
            result++;
        }
        if (x >= range &&
            y < height - range &&
            isSimilarHSLColor(getHSLColorForPixel(x - range, y + range, pixels), hslColor, colorRange)) {
            result++;
        }
        if (x < width - range &&
            y < height - range &&
            isSimilarHSLColor(getHSLColorForPixel(x + range, y + range, pixels), hslColor, colorRange)) {
            result++;
        }
    }
    return result;
}
function getHSLColorForPixel(x, y, pixels) {
    var rgba = getRGBAColorForPixel(x, y, pixels);
    return rgbToHsl(rgba.r, rgba.g, rgba.b);
}
function getRGBAColorForPixel(x, y, pixels) {
    //const i = y * (width * 4) + x * 4;
    return {
        r: pixels.get(x, y, 0),
        g: pixels.get(x, y, 1),
        b: pixels.get(x, y, 2),
        a: pixels.get(x, y, 3)
    };
}
/**
 *
 * @param colorA - Color to compare to `colorB`
 * @param colorB - Color to compare to `colorA`
 * @param params - Range to controll how similar both colors have to be.
 */
function isSimilarHSLColor(colorA, colorB, params) {
    if (Math.abs(colorA.h - colorB.h) <= params.hRange &&
        Math.abs(colorA.s - colorB.s) <= params.sRange &&
        Math.abs(colorA.l - colorB.l) <= params.lRange) {
        return true;
    }
    return false;
}
function rgbToHsl(r, g, b) {
    (r /= 255), (g /= 255), (b /= 255);
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
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
function main(points, path) {
    return __awaiter(this, void 0, void 0, function () {
        var centroids, angle, pixels, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    centroids = getAllCentroids(points);
                    console.log(centroids);
                    angle = getAngle(points[0], points[1], points[2], points[3]);
                    return [4 /*yield*/, getPixels(path)];
                case 1:
                    pixels = _a.sent();
                    result = getOrientation(centroids, pixels);
                    console.log(angle);
                    console.log(result);
                    return [2 /*return*/];
            }
        });
    });
}
main([new Point(0, 0), new Point(600, 0), new Point(600, 800), new Point(0, 800)], "../../../img/90clockwise.png");
/**
 * Label all the corners
 */
function cornerLabeling(p1, p2, p3, p4) {
    var corners = [p1, p2, p3, p4];
    var sums = [];
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    var rightUnderIndex, leftUpperIndex;
    var rightUpperCoordinate, leftUnderCoordinate, leftUpperCoordinate, rightUnderCoordinate;
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
    }
    else {
        rightUpperCoordinate = corners[1];
        leftUnderCoordinate = corners[0];
    }
    return { "LeftUp": leftUpperCoordinate, "RightUp": rightUpperCoordinate, "RightUnder": rightUnderCoordinate, "LeftUnder": leftUnderCoordinate };
}
function getAngle(p1, p2, p3, p4) {
    var labeledCorners = cornerLabeling(p1, p2, p3, p4);
    var left = labeledCorners["LeftUp"];
    var right = labeledCorners["RightUp"];
    var origin = left;
    var vector1 = new Point(right.x - origin.x, left.y - origin.y);
    var vector2 = new Point(right.x - origin.x, right.y - origin.y);
    var radians = Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);
    return radians * (180 / Math.PI);
}
function getAllCentroids(points) {
    /**
     * Get the centroid (center point) of the 4 given corner points.
     *
     * @param points List of points representing the 4 corner-points to get the centroid for.
     */
    function getCentroidOf(points) {
        var sumX = 0;
        var sumY = 0;
        points.forEach(function (point) {
            sumX += point.x;
            sumY += point.y;
        });
        return new Point(Math.round(sumX / points.length), Math.round(sumY / points.length));
    }
    var labeledCorners = cornerLabeling(points[0], points[1], points[2], points[3]);
    var leftUpper = labeledCorners["LeftUp"];
    var rightUpper = labeledCorners["RightUp"];
    var leftUnder = labeledCorners["LeftUnder"];
    var rightUnder = labeledCorners["RightUnder"];
    var upperMiddle = new Point((rightUpper.x + leftUpper.x) / 2, (rightUpper.y + leftUpper.y) / 2);
    var lowerMiddle = new Point((rightUnder.x + leftUnder.x) / 2, (rightUnder.y + leftUnder.y) / 2);
    var leftMiddle = new Point((leftUpper.x + leftUnder.x) / 2, (leftUpper.y + leftUnder.y) / 2);
    var rightMiddle = new Point((rightUnder.x + rightUpper.x) / 2, (rightUnder.y + rightUpper.y) / 2);
    var centroid = getCentroidOf(points);
    var centroid1 = getCentroidOf([leftUpper, upperMiddle, leftMiddle, centroid]);
    var centroid2 = getCentroidOf([upperMiddle, rightUpper, centroid, rightMiddle]);
    var centroid3 = getCentroidOf([leftMiddle, centroid, leftUnder, lowerMiddle]);
    var centroid4 = getCentroidOf([centroid, rightMiddle, lowerMiddle, rightUnder]);
    return { "0": centroid1, "1": centroid2, "3": centroid3, "2": centroid4 };
}
function checkColor(centroid, pixels, key) {
    var RANGE = 3;
    var THRESHOLD = 18;
    for (var i = 0; i < colors.length; i++) {
        if (amountOfNeighboringPixelsWithColor(pixels, RANGE, centroid.x, centroid.y, pixels.shape[0], pixels.shape[1], colors[i], colorRange) > THRESHOLD) {
            var orientationNumber = parseInt(key) - i;
            if (orientationNumber == 1 || orientationNumber == -3) {
                //return("rotated to the right right at an angle of: ")
                return orientations_1.Orientation.CLOCKWISE;
            }
            if (orientationNumber == -2 || orientationNumber == 2) {
                //return("Upside down, at an angle of: ")
                return orientations_1.Orientation.FLIPPED;
            }
            if (orientationNumber == 0) {
                //return("Standard orientation at an angle of: ")
                return orientations_1.Orientation.NORMAL;
            }
            if (orientationNumber == -1 || orientationNumber == 3) {
                //return("rotated to the left at an angle of: ")
                return orientations_1.Orientation.COUNTERCLOCKWISE;
            }
        }
    }
    return orientations_1.Orientation.NONE;
}
function getOrientation(centroids, pixels) {
    var centroid;
    var orientations = [];
    orientations[0] = 0;
    orientations[1] = 0;
    orientations[2] = 0;
    orientations[3] = 0;
    var ORIENTATION;
    var MAXINDEX;
    for (var key in centroids) {
        centroid = centroids[key];
        //console.log(checkColor(centroid, pixels, key), " degrees");
        //console.log(key)
        // your code here...
        switch (checkColor(centroid, pixels, key)) {
            case orientations_1.Orientation.NORMAL:
                orientations[0] += 1;
            case orientations_1.Orientation.CLOCKWISE:
                orientations[1] += 1;
            case orientations_1.Orientation.COUNTERCLOCKWISE:
                orientations[2] += 1;
            case orientations_1.Orientation.NORMAL:
                orientations[3] += 1;
        }
    }
    var MAX = 0;
    for (var i = 0; i < orientations.length; i++) {
        if (orientations[i] > MAX) {
            MAX = orientations[i];
            MAXINDEX = i;
        }
    }
    switch (MAXINDEX) {
        case 0:
            return orientations_1.Orientation.NORMAL;
        case 1:
            return orientations_1.Orientation.CLOCKWISE;
        case 2:
            return orientations_1.Orientation.COUNTERCLOCKWISE;
        case 3:
            return orientations_1.Orientation.FLIPPED;
    }
    return orientations_1.Orientation.NONE;
}
