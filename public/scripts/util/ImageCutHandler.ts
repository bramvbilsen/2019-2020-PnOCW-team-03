import { BoundingBox } from "./BoundingBox";
import { scaleAndCutImageToBoundingBoxAspectRatio } from "./images";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import SlaveScreen from "./SlaveScreen";
import { degreesToRadians, rotatePointAroundAnchor } from "./angles";
import { calculateBoundingBox } from "./shapes";
import Point from "../image_processing/screen_detection/Point";

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
    const screenCenter = new Point(
        screen.centroid.x - globalBoundingBox.topLeft.x,
        screen.centroid.y - globalBoundingBox.topLeft.y
    );

    // TODO: DELETE THIS!!!!
    screen.orientation = 0;

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
    slaveScreenMaskCtx.moveTo(
        corners[0].x - globalBoundingBox.topLeft.x,
        corners[0].y - globalBoundingBox.topLeft.y
    );
    slaveScreenMaskCtx.lineTo(
        corners[1].x - globalBoundingBox.topLeft.x,
        corners[1].y - globalBoundingBox.topLeft.y
    );
    slaveScreenMaskCtx.lineTo(
        corners[2].x - globalBoundingBox.topLeft.x,
        corners[2].y - globalBoundingBox.topLeft.y
    );
    slaveScreenMaskCtx.lineTo(
        corners[3].x - globalBoundingBox.topLeft.x,
        corners[3].y - globalBoundingBox.topLeft.y
    );
    slaveScreenMaskCtx.fill();

    const maskedImg = createCanvas(imgCanvas.width, imgCanvas.height);
    const maskedImgCtx = maskedImg.getContext("2d");
    maskedImgCtx.drawImage(slaveScreenMask, 0, 0);
    maskedImgCtx.globalCompositeOperation = "source-in";
    maskedImgCtx.drawImage(rotatedImg, 0, 0);

    const slaveImg = createCanvas(screen.width, screen.height);
    const slaveImgCtx = slaveImg.getContext("2d");
    const boundingBoxCorners = calculateBoundingBox(corners);
    slaveImgCtx.drawImage(
        maskedImg,
        0,
        0,
        screen.width,
        screen.height,
        0,
        0,
        screen.width,
        screen.height
    );

    return slaveImg;
}
