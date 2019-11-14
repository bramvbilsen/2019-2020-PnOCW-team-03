import {IRGBAColor } from "../../types/Color";
import Point from "../screen_detection/Point"
var PerspT = require('perspective-transform');


/** 
 * Given:  An image to transform
 *         The 4 points of the screen, to be transformed
 *         The 4 points of the Bounding Box, to transform to
 *         
*/

function transform(srcPoints: Point[], dstPoints: Point[], canvas: HTMLCanvasElement) {

    let perspTransform = PerspT(srcPoints, dstPoints);
    
    let ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
    let PixelData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (let x = 0; x < PixelData.width; x++) {
        for (let y = 0; y < PixelData.width; y++) {
            let dstPt = convertToPoint([x,y]);
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

export function transformTest() {
    let dstPoint1 = new Point(0,0);
    let dstPoint2 = new Point(4,0);
    let dstPoint3 = new Point(4,4);
    let dstPoint4 = new Point(0,4);
    let srcPoint1 = new Point(1,1);
    let srcPoint2 = new Point(3,1);
    let srcPoint3 = new Point(3,3);
    let srcPoint4 = new Point(1,3);
    let srcPoints = [srcPoint1, srcPoint2, srcPoint3, srcPoint4];
    let dstPoints = [dstPoint1, dstPoint2, dstPoint3, dstPoint4];
    const resultingScreenCanvas = createCanvas(5, 5);
    const resultingScreenCtx = <CanvasRenderingContext2D>(
        resultingScreenCanvas.getContext("2d")
    );
    resultingScreenCtx.fillStyle = "rgb(0, 0, 0)";
    resultingScreenCtx.fillRect(0, 0, 800, 600);

    let perspTransform = PerspT(srcPoints, dstPoints);
    
    let ctx = <CanvasRenderingContext2D>resultingScreenCanvas.getContext("2d");
    let PixelData = ctx.getImageData(
        0,
        0,
        resultingScreenCanvas.width,
        resultingScreenCanvas.height
    );

    for (let x = 0; x < PixelData.width; x++) {
        for (let y = 0; y < PixelData.width; y++) {
            let dstPt = convertToPoint([x,y]);
            var srcPt = convertToPoint(perspTransform.transformInverse(x, y));
            console.log(dstPt);
            console.log(srcPt);
        }
    }
    
    
    
}



function changePixelData(ctx: CanvasRenderingContext2D, pixelData: ImageData, srcPoint: Point, dstPoint: Point, width: number): CanvasRenderingContext2D {
    const dstI = (width * dstPoint.y + dstPoint.x) * 4;
    const srcI = (width * srcPoint.y + srcPoint.x) * 4;
    pixelData.data[dstI]     = pixelData.data[srcI];     // red
    pixelData.data[dstI + 1] = pixelData.data[srcI+ 1]; // green
    pixelData.data[dstI + 2] = pixelData.data[srcI + 2]; // blue
    
    ctx.putImageData(pixelData, 0, 0);
    return ctx;
      
};

function getPixelColor(pixelData: ImageData, x: number, y: number,  width: number, height: number) :IRGBAColor {

    const i = (width * y + x) * 4;

    const color = <IRGBAColor> {
        r: pixelData.data[i],
        g: pixelData.data[i+1],
        b: pixelData.data[i+2],
        a: pixelData.data[i+3]
    } 
    return color;
}

function convertToPoint(coords: number[]): Point {
    let point = new Point(coords[0], coords[1]);
    return point;
}

function convertToNumbers(point: Point): Number[] {
    let coords = [point.x, point.y];
    return coords;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

