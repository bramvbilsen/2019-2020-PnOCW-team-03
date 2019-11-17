import { BoundingBox } from "./BoundingBox";
import { scaleAndCutImageToBoundingBoxAspectRatio } from "./images";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import SlaveScreen from "./SlaveScreen";
import { degreesToRadians, rotatePointAroundAnchor } from "./angles";
import { calculateBoundingBox } from "./shapes";

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
    const screenCenter = screen.centroid;

    // Rotate the image to the same rotation as the screen
    const rotatedImg = createCanvas(imgCanvas.width, imgCanvas.height);
    const rotatedImgCtx = rotatedImg.getContext("2d");
    rotatedImgCtx.translate(screenCenter.x, screenCenter.y);
    rotatedImgCtx.rotate(degreesToRadians(screen.orientation));
    rotatedImgCtx.translate(-screenCenter.x, -screenCenter.y);
    rotatedImgCtx.drawImage(imgCanvas, 0, 0);

    // Rotate the screen to have a 0deg angle.
    screen.sortCornersByAngle();
    const corners = screen.corners.map(corner =>
        rotatePointAroundAnchor(corner, screenCenter, -screen.orientation)
    );
    const slaveScreenMask = createCanvas(imgCanvas.width, imgCanvas.height);
    const slaveScreenMaskCtx = slaveScreenMask.getContext("2d");
    slaveScreenMaskCtx.beginPath();
    slaveScreenMaskCtx.moveTo(corners[0].x, corners[0].y);
    slaveScreenMaskCtx.lineTo(corners[1].x, corners[1].y);
    slaveScreenMaskCtx.lineTo(corners[2].x, corners[2].y);
    slaveScreenMaskCtx.lineTo(corners[3].x, corners[3].y);
    slaveScreenMaskCtx.fill();

    const maskedImg = createCanvas(
        globalBoundingBox.width + globalBoundingBox.topLeft.x,
        globalBoundingBox.height + globalBoundingBox.topLeft.y
    );
    const maskedImgCtx = maskedImg.getContext("2d");
    maskedImgCtx.drawImage(slaveScreenMask, 0, 0);
    maskedImgCtx.globalCompositeOperation = "source-in";
    maskedImgCtx.drawImage(rotatedImg, 0, 0);

    const slaveImg = createCanvas(screen.width, screen.height);
    const slaveImgCtx = slaveImg.getContext("2d");
    const boundingBoxCorners = calculateBoundingBox(corners);
    slaveImgCtx.drawImage(
        maskedImg,
        boundingBoxCorners.topLeft.x,
        boundingBoxCorners.topLeft.y,
        boundingBoxCorners.topLeft.x + screen.width,
        boundingBoxCorners.topLeft.y + screen.height,
        0,
        0,
        boundingBoxCorners.topLeft.x + screen.width,
        boundingBoxCorners.topLeft.y + screen.height
    );

    return slaveImg;
}
