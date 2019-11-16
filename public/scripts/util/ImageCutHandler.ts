import { BoundingBox } from "./BoundingBox";
import { scaleAndCutImageToBoundingBoxAspectRatio } from "./images";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";

/**
 * Creates/cuts images to display on slaves
 * @param globalBoundingBox
 * @param img Either a string reference to the image or a canvas with the image on it.
 */
export function createImageCanvasForSlave(
    globalBoundingBox: BoundingBox,
    screenBoundingBox: BoundingBox,
    imgCanvas: HTMLCanvasElement
) {
    imgCanvas = scaleAndCutImageToBoundingBoxAspectRatio(
        imgCanvas,
        globalBoundingBox
    );
    const screenCanvas = createCanvas(
        screenBoundingBox.width,
        screenBoundingBox.height
    );
    const screenCtx = screenCanvas.getContext("2d");
    screenCtx.drawImage(
        imgCanvas,
        screenBoundingBox.topLeft.x,
        screenBoundingBox.topLeft.y,
        screenBoundingBox.width,
        screenBoundingBox.height,
        0,
        0,
        screenBoundingBox.width,
        screenBoundingBox.height
    );
    return screenCanvas;
}
