import { BoundingBox } from "./BoundingBox";
import { scaleAndCutImageToBoundingBoxAspectRatio } from "./images";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import SlaveScreen from "./SlaveScreen";
import { degreesToRadians, rotatePointAroundAnchor } from "./angles";
import Point from "../image_processing/screen_detection/Point";
import create3DMatrix from "../image_processing/Image Casting/perspective";
import convexHull from "../image_processing/screen_detection/hull";
import { sortCorners } from "./shapes";

/**
 * Creates/cuts images to display on slaves
 * @param globalBoundingBox Bouding box around all the screens
 * @param screen Screen of slave
 * @param img Canvas with the image to display on.
 */
export function createImageCanvasForSlave(
    globalBoundingBox: BoundingBox,
    screen: SlaveScreen,
    imgCanvas: HTMLCanvasElement
) {
    imgCanvas = scaleAndCutImageToBoundingBoxAspectRatio(
        imgCanvas,
        globalBoundingBox
    );
    return rotateAndDrawImageForSlave(globalBoundingBox, screen, imgCanvas);
}

/**
 *
 * @param globalBoundingBox Bouding box around all the screens
 * @param screen Screen of slave
 * @param imgCanvas image of canvas already scaled to fill `globalBoundingBox`
 */
function rotateAndDrawImageForSlave(
    globalBoundingBox: BoundingBox,
    screen: SlaveScreen,
    imgCanvas: HTMLCanvasElement
): HTMLCanvasElement {

    // const translatedCorners = {
    //     LeftUp: screen.sortedCorners.LeftUp.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    //     RightUp: screen.sortedCorners.RightUp.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    //     RightUnder: screen.sortedCorners.RightUnder.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    //     LeftUnder: screen.sortedCorners.LeftUnder.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    // }
    // const src: [Point, Point, Point, Point] = [translatedCorners.LeftUp, translatedCorners.RightUp, translatedCorners.RightUnder, translatedCorners.LeftUnder];

    // const css3DMatrix = create3DMatrix(src, dst);

    let outputIm: JQuery<HTMLImageElement> = $(`<img style="max-width: 100%; max-height: 100%;" />`);
    outputIm.attr("src", imgCanvas.toDataURL());
    $("#result-img-container").append($("<h1>NEW SCREEN</h1>"));
    $("#result-img-container").append(outputIm);


    const screenCenter = screen.centroid.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y);
    const translatedAndRotatedCorners = {
        LeftUp: rotatePointAroundAnchor(screen.sortedCorners.LeftUp.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y), screenCenter, -screen.angle),
        RightUp: rotatePointAroundAnchor(screen.sortedCorners.RightUp.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y), screenCenter, -screen.angle),
        RightUnder: rotatePointAroundAnchor(screen.sortedCorners.RightUnder.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y), screenCenter, -screen.angle),
        LeftUnder: rotatePointAroundAnchor(screen.sortedCorners.LeftUnder.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y), screenCenter, -screen.angle),
    }

    const screenWidth = screen.width;
    const screenHeight = screen.height;

    const rotatedImg = createCanvas(imgCanvas.width, imgCanvas.height);
    const rotatedImgCtx = rotatedImg.getContext("2d");
    console.log("ANGLE: " + screen.angle);
    console.log("CENTER: " + screen.centroid);
    if (screen.angle !== 0) {
        rotatedImgCtx.translate(screenCenter.x, screenCenter.y);
        rotatedImgCtx.rotate(degreesToRadians(screen.angle));
        rotatedImgCtx.translate(-screenCenter.x, -screenCenter.y);
    }
    rotatedImgCtx.drawImage(imgCanvas, 0, 0);
    outputIm = $(`<img style="max-width: 100%; max-height: 100%;" />`);
    outputIm.attr("src", rotatedImg.toDataURL());
    $("#result-img-container").append($("<h3>ROTATED IMG</h3>"));
    $("#result-img-container").append(outputIm);
    $("#test-results").append($("<h3>ROTATED IMG</h3>"));
    $("#test-results").append(outputIm);

    const slaveScreenMask = createCanvas(imgCanvas.width, imgCanvas.height);
    const slaveScreenMaskCtx = slaveScreenMask.getContext("2d");
    slaveScreenMaskCtx.beginPath();
    slaveScreenMaskCtx.moveTo(
        translatedAndRotatedCorners.LeftUp.x,
        translatedAndRotatedCorners.LeftUp.y
    );
    slaveScreenMaskCtx.lineTo(
        translatedAndRotatedCorners.RightUp.x,
        translatedAndRotatedCorners.RightUp.y
    );
    slaveScreenMaskCtx.lineTo(
        translatedAndRotatedCorners.RightUnder.x,
        translatedAndRotatedCorners.RightUnder.y
    );
    slaveScreenMaskCtx.lineTo(
        translatedAndRotatedCorners.LeftUnder.x,
        translatedAndRotatedCorners.LeftUnder.y
    );
    slaveScreenMaskCtx.fill();
    outputIm = $(
        `<img id="result-img" style="max-width: 100%; max-height: 100%;" />`
    );
    outputIm.attr("src", slaveScreenMask.toDataURL());
    $("#result-img-container").append($("<h3>MASKED IMG</h3>"));
    $("#result-img-container").append(outputIm);
    $("#test-results").append($("<h3>SCREEN MASK</h3>"));
    $("#test-results").append(outputIm);

    const maskedImg = createCanvas(imgCanvas.width, imgCanvas.height);
    const maskedImgCtx = maskedImg.getContext("2d");
    maskedImgCtx.drawImage(slaveScreenMask, 0, 0);
    maskedImgCtx.globalCompositeOperation = "source-in";
    maskedImgCtx.drawImage(rotatedImg, 0, 0);
    outputIm = $(
        `<img id="result-img" style="max-width: 100%; max-height: 100%;" />`
    );
    outputIm.attr("src", maskedImg.toDataURL());
    $("#result-img-container").append($("<h3>MASKED IMG</h3>"));
    $("#result-img-container").append(outputIm);
    $("#test-results").append($("<h3>MASKED IMG</h3>"));
    $("#test-results").append(outputIm);


    // const cornersWithoutPerspective = new BoundingBox((Object.values(translatedAndRotatedCorners)));

    // const src: [Point, Point, Point, Point] = [translatedAndRotatedCorners.LeftUp, translatedAndRotatedCorners.RightUp, translatedAndRotatedCorners.RightUnder, translatedAndRotatedCorners.LeftUnder];
    // const dst: [Point, Point, Point, Point] = [cornersWithoutPerspective.topLeft, cornersWithoutPerspective.topRight, cornersWithoutPerspective.bottomRight, cornersWithoutPerspective.bottomLeft];
    // console.log("src: " + src);
    // console.log("dst: " + dst);
    // const css3DMatrix = create3DMatrix(src, dst);
    // const imgWithPerspective: JQuery<HTMLImageElement> = $(`<img style="max-width: 100%; max-height: 100%;" />`);
    // imgWithPerspective.attr("src", maskedImg.toDataURL());
    // imgWithPerspective.css("transform", css3DMatrix);
    // imgWithPerspective.css("transformOrigin", "0 0");
    // $("#result-img-container").append($("<h3>IMG WITH PERSPECTIVE</h3>"));
    // $("#result-img-container").append(imgWithPerspective);
    // $("#result-img-container").append($("<h3>IMG WITH PERSPECTIVE</h3>"));
    // $("#test-results").append(imgWithPerspective);

    const slaveImg = createCanvas(screenWidth, screenHeight);
    const slaveImgCtx = slaveImg.getContext("2d");
    slaveImgCtx.drawImage(
        maskedImg,
        translatedAndRotatedCorners.LeftUp.x,
        translatedAndRotatedCorners.LeftUp.y,
        screenWidth,
        screenHeight,
        0,
        0,
        screenWidth,
        screenHeight
    );
    outputIm = $(
        `<img id="result-img" style="max-width: 100%; max-height: 100%;" />`
    );
    outputIm.attr("src", slaveImg.toDataURL());

    $("#result-img-container").append($("<h3>SLAVE IMAGE</h3>"));
    $("#result-img-container").append(outputIm);
    $("#test-results").append($("<h3>SLAVE IMAGE</h3>"));
    $("#test-results").append(outputIm);

    return slaveImg;
}
