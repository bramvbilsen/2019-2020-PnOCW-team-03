"use strict";
exports.__esModule = true;
var Point_1 = require("../screen_detection/Point");
var PerspT = require('perspective-transform');
/**
 * Given:  An image to transform
 *         The 4 points of the screen, to be transformed
 *         The 4 points of the Bounding Box, to transform to
 *
*/
function transform(srcPoints, dstPoints, canvas) {
    var perspTransform = PerspT(srcPoints, dstPoints);
    var ctx = canvas.getContext("2d");
    var PixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (var x = 0; x < PixelData.width; x++) {
        for (var y = 0; y < PixelData.width; y++) {
            var dstPt = convertToPoint([x, y]);
            var srcPt = convertToPoint(perspTransform.transformInverse(x, y));
            changePixelData(ctx, PixelData, srcPt, dstPt, PixelData.width);
        }
    }
    /* let src = cv.imread('canvasInput');
    let dst = new cv.Mat();
    let dsize = new cv.Size(src.rows, src.cols);
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [Points[0], Points[1], Points[2], Points[3], Points[4], Points[5], Points[6], Points[7]]);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, boundingBoxPoints[2], 0, 0, boundingBoxPoints[5], boundingBoxPoints[6], boundingBoxPoints[7]]);
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    cv.warpPerspective(src, dstTri, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    cv.imshow('canvasOutput', dst);
    src.delete(); dst.delete(); M.delete(); srcTri.delete(); dstTri.delete(); */
}
function transformTest() {
    var dstPoint1 = new Point_1["default"](0, 0);
    var dstPoint2 = new Point_1["default"](4, 0);
    var dstPoint3 = new Point_1["default"](4, 4);
    var dstPoint4 = new Point_1["default"](0, 4);
    var srcPoint1 = new Point_1["default"](1, 1);
    var srcPoint2 = new Point_1["default"](3, 1);
    var srcPoint3 = new Point_1["default"](3, 3);
    var srcPoint4 = new Point_1["default"](1, 3);
    var srcPoints = [srcPoint1, srcPoint2, srcPoint3, srcPoint4];
    var dstPoints = [dstPoint1, dstPoint2, dstPoint3, dstPoint4];
    var resultingScreenCanvas = createCanvas(5, 5);
    var resultingScreenCtx = (resultingScreenCanvas.getContext("2d"));
    resultingScreenCtx.fillStyle = "rgb(0, 0, 0)";
    resultingScreenCtx.fillRect(0, 0, 800, 600);
    var perspTransform = PerspT(srcPoints, dstPoints);
    var ctx = resultingScreenCanvas.getContext("2d");
    var PixelData = ctx.getImageData(0, 0, resultingScreenCanvas.width, resultingScreenCanvas.height);
    for (var x = 0; x < PixelData.width; x++) {
        for (var y = 0; y < PixelData.width; y++) {
            var dstPt = convertToPoint([x, y]);
            var srcPt = convertToPoint(perspTransform.transformInverse(x, y));
            console.log(dstPt);
            console.log(srcPt);
        }
    }
}
exports.transformTest = transformTest;
function changePixelData(ctx, pixelData, srcPoint, dstPoint, width) {
    var dstI = (width * dstPoint.y + dstPoint.x) * 4;
    var srcI = (width * srcPoint.y + srcPoint.x) * 4;
    pixelData.data[dstI] = pixelData.data[srcI]; // red
    pixelData.data[dstI + 1] = pixelData.data[srcI + 1]; // green
    pixelData.data[dstI + 2] = pixelData.data[srcI + 2]; // blue
    ctx.putImageData(pixelData, 0, 0);
    return ctx;
}
;
function getPixelColor(pixelData, x, y, width, height) {
    var i = (width * y + x) * 4;
    var color = {
        r: pixelData.data[i],
        g: pixelData.data[i + 1],
        b: pixelData.data[i + 2],
        a: pixelData.data[i + 3]
    };
    return color;
}
function convertToPoint(coords) {
    var point = new Point_1["default"](coords[0], coords[1]);
    return point;
}
function convertToNumbers(point) {
    var coords = [point.x, point.y];
    return coords;
}
function createCanvas(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
