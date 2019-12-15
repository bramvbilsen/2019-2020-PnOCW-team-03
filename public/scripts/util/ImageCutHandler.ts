import { BoundingBox } from "./BoundingBox";
import { scaleAndCutImageToBoundingBoxAspectRatio } from "./images";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import SlaveScreen from "./SlaveScreen";
import { degreesToRadians, rotatePointAroundAnchor } from "./angles";
import Point from "../image_processing/screen_detection/Point";
import create3DMatrix from "../image_processing/Image Casting/perspective";
import convexHull from "../image_processing/screen_detection/hull";
import { sortCorners } from "./shapes";
import { client } from "../../index";

/**
 * Creates/cuts images to display on slaves
 * @param globalBoundingBox Bouding box around all the screens
 * @param screen Screen of slave
 * @param img Canvas with the image to display on.
 */
export function createImageCanvasForSlave(
    globalBoundingBox: BoundingBox,
    screen: SlaveScreen,
    screens: SlaveScreen[],
    imgCanvas: HTMLCanvasElement
) {
    let extraWidth = 0;
    let extraHeight = 0;
    screens.forEach(screen => {
        if (screen.width > extraWidth) {
            extraWidth = screen.width;
        }
        if (screen.height > extraHeight) {
            extraHeight = screen.height;
        }
    });
    imgCanvas = scaleAndCutImageToBoundingBoxAspectRatio(
        imgCanvas,
        globalBoundingBox,
        extraWidth,
        extraHeight
    );
    return rotateAndDrawImageForSlave(globalBoundingBox, screen, imgCanvas, extraWidth / 2, extraHeight / 2);
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
    imgCanvas: HTMLCanvasElement,
    widthOffset: number,
    heightOffset: number,
): HTMLCanvasElement {

    const screenAngle = screen.angle;

    // const translatedCorners = {
    //     LeftUp: screen.sortedCorners.LeftUp.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    //     RightUp: screen.sortedCorners.RightUp.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    //     RightUnder: screen.sortedCorners.RightUnder.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    //     LeftUnder: screen.sortedCorners.LeftUnder.copyTranslated(-globalBoundingBox.topLeft.x, -globalBoundingBox.topLeft.y),
    // }
    // const src: [Point, Point, Point, Point] = [translatedCorners.LeftUp, translatedCorners.RightUp, translatedCorners.RightUnder, translatedCorners.LeftUnder];

    // const css3DMatrix = create3DMatrix(src, dst);

    $("#result-img-container").append($("<h1>NEW SCREEN</h1>"));
    $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", imgCanvas.toDataURL()));


    const screenCenter = screen.centroid.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset);
    const translatedAndRotatedCorners = {
        LeftUp: rotatePointAroundAnchor(screen.sortedCorners.LeftUp.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset), screenCenter, -screenAngle),
        RightUp: rotatePointAroundAnchor(screen.sortedCorners.RightUp.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset), screenCenter, -screenAngle),
        RightUnder: rotatePointAroundAnchor(screen.sortedCorners.RightUnder.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset), screenCenter, -screenAngle),
        LeftUnder: rotatePointAroundAnchor(screen.sortedCorners.LeftUnder.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset), screenCenter, -screenAngle),
    }

    const translatedCornersWithoutRotation = {
        LeftUp: screen.sortedCorners.LeftUp.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
        RightUp: screen.sortedCorners.RightUp.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
        RightUnder: screen.sortedCorners.RightUnder.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
        LeftUnder: screen.sortedCorners.LeftUnder.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
    }

    const translatedBoundingBoxCornersWithoutRotation = {
        LeftUp: screen.boundingBox.topLeft.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
        RightUp: screen.boundingBox.topRight.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
        RightUnder: screen.boundingBox.bottomRight.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
        LeftUnder: screen.boundingBox.bottomLeft.copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset),
    }

    const screenWidth = screen.width;
    const screenHeight = screen.height;

    const rotatedImg = createCanvas(imgCanvas.width, imgCanvas.height);
    const rotatedImgCtx = rotatedImg.getContext("2d");
    console.log("ANGLE: " + screenAngle);
    console.log("CENTER: " + screen.centroid);
    if (screenAngle !== 0) {
        rotatedImgCtx.translate(screenCenter.x, screenCenter.y);
        rotatedImgCtx.rotate(degreesToRadians(-screenAngle));
        rotatedImgCtx.translate(-screenCenter.x, -screenCenter.y);
    }
    rotatedImgCtx.drawImage(imgCanvas, 0, 0)
    $("#test-results").append($("<h3>ROTATED IMG</h3>"));
    $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", rotatedImg.toDataURL()));
    $("#result-img-container").append($("<h3>ROTATED IMG</h3>"));
    $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", rotatedImg.toDataURL()));

    const slaveScreenMask = createCanvas(imgCanvas.width, imgCanvas.height);
    const slaveScreenMaskCtx = slaveScreenMask.getContext("2d");
    slaveScreenMaskCtx.beginPath();
    slaveScreenMaskCtx.moveTo(
        translatedCornersWithoutRotation.LeftUp.x,
        translatedCornersWithoutRotation.LeftUp.y
    );
    slaveScreenMaskCtx.lineTo(
        translatedCornersWithoutRotation.RightUp.x,
        translatedCornersWithoutRotation.RightUp.y
    );
    slaveScreenMaskCtx.lineTo(
        translatedCornersWithoutRotation.RightUnder.x,
        translatedCornersWithoutRotation.RightUnder.y
    );
    slaveScreenMaskCtx.lineTo(
        translatedCornersWithoutRotation.LeftUnder.x,
        translatedCornersWithoutRotation.LeftUnder.y
    );
    slaveScreenMaskCtx.fill()
    $("#result-img-container").append($("<h3>SCREEN IMG</h3>"));
    $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveScreenMask.toDataURL()));
    $("#test-results").append($("<h3>SCREEN MASK</h3>"));
    $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveScreenMask.toDataURL()));

    const slaveScreenMaskRotated = createCanvas(imgCanvas.width, imgCanvas.height);
    const slaveScreenMaskRotatedCtx = slaveScreenMaskRotated.getContext("2d");

    slaveScreenMaskRotatedCtx.translate(screenCenter.x, screenCenter.y);
    slaveScreenMaskRotatedCtx.rotate(degreesToRadians(-screenAngle));
    slaveScreenMaskRotatedCtx.translate(-screenCenter.x, -screenCenter.y);
    slaveScreenMaskRotatedCtx.drawImage(slaveScreenMask, 0, 0);

    $("#result-img-container").append($("<h3>SCREEN MASK ROTATED</h3>"));
    $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveScreenMaskRotated.toDataURL()));
    $("#test-results").append($("<h3>SCREEN MASK ROTATED</h3>"));
    $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveScreenMaskRotated.toDataURL()));

    //---- THIS IS WHAT WE USED BEFORE FOR BOUNDING BOX CUTS
    // const slaveScreenBoundingBoxMaskRotated = createCanvas(imgCanvas.width, imgCanvas.height);
    // const slaveScreenBoundingBoxMaskRotatedCtx = slaveScreenBoundingBoxMaskRotated.getContext("2d");

    // const rotatedAndTranslatedScreenCopy = screen.copyRotated(-screenAngle).copyTranslated(-globalBoundingBox.topLeft.x + widthOffset, -globalBoundingBox.topLeft.y + heightOffset);
    // slaveScreenBoundingBoxMaskRotatedCtx.fillRect(rotatedAndTranslatedScreenCopy.boundingBox.topLeft.x, rotatedAndTranslatedScreenCopy.boundingBox.topLeft.y, rotatedAndTranslatedScreenCopy.width, rotatedAndTranslatedScreenCopy.height);

    // $("#result-img-container").append($("<h3>BOUNDING BOX MASK</h3>"));
    // $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveScreenBoundingBoxMaskRotated.toDataURL()));
    // $("#test-results").append($("<h3>BOUNDING BOX MASL</h3>"));
    // $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveScreenBoundingBoxMaskRotated.toDataURL()));
    //----

    const maskedImg = createCanvas(imgCanvas.width, imgCanvas.height);
    const maskedImgCtx = maskedImg.getContext("2d");
    //@ts-ignore
    maskedImgCtx.drawImage(slaveScreenMaskRotated, 0, 0);
    maskedImgCtx.globalCompositeOperation = "source-in";
    maskedImgCtx.drawImage(rotatedImg, 0, 0);
    $("#result-img-container").append($("<h3>MASKED IMG</h3>"));
    $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", maskedImg.toDataURL()));
    $("#test-results").append($("<h3>MASKED MASK</h3>"));
    $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", maskedImg.toDataURL()));


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

    // const reRotatedImg = createCanvas(screenWidth, screenHeight);
    // const reRotatedImgCtx = reRotatedImg.getContext("2d");
    // if (screenAngle !== 0) {
    //     reRotatedImgCtx.translate(screenCenter.x, screenCenter.y);
    //     reRotatedImgCtx.rotate(degreesToRadians(-screenAngle));
    //     reRotatedImgCtx.translate(-screenCenter.x, -screenCenter.y);
    // }
    // reRotatedImgCtx.drawImage(maskedImg, 0, 0);
    // $("#result-img-container").append($("<h3>RE ROTATED IMG</h3>"));
    // $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", reRotatedImg.toDataURL()));
    // $("#test-results").append($("<h3>RE ROTATED IMG</h3>"));
    // $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", reRotatedImg.toDataURL()));


    const slaveImg = createCanvas(screenWidth, screenHeight);
    const slaveImgCtx = slaveImg.getContext("2d");
    // For some reason, the calc for position is always off by a few pixels, therfor the 25px offset
    slaveImgCtx.drawImage(
        client.cutWithRealPoints ? maskedImg : rotatedImg,
        screenCenter.x - (screen.width / 2),
        screenCenter.y - (screen.height / 2),
        screenWidth,
        screenHeight,
        0,
        0,
        screenWidth,
        screenHeight
    );
    $("#result-img-container").append($("<h3>RESULT IMG</h3>"));
    $("#result-img-container").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveImg.toDataURL()));
    $("#test-results").append($("<h3>RESULT MASK</h3>"));
    $("#test-results").append($(`<img style="max-width: 100%; max-height: 100%;" />`).attr("src", slaveImg.toDataURL()));

    return slaveImg;
}
