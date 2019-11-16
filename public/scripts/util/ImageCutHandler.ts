import { BoundingBox } from "./BoundingBox";
import { scaleAndCutImageToBoundingBoxAspectRatio } from "./images";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import SlaveScreen from "./SlaveScreen";

/**
 * Creates/cuts images to display on slaves
 * @param globalBoundingBox
 * @param img Either a string reference to the image or a canvas with the image on it.
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
    const screenCanvas = createCanvas(
        screen.boundingBox.width,
        screen.boundingBox.height
    );
    const screenCtx = screenCanvas.getContext("2d");
    return rotateAndDrawImageForSlave(screen, imgCanvas);
}

function rotateAndDrawImageForSlave(
    screen: SlaveScreen,
    imgCanvas: HTMLCanvasElement
): HTMLCanvasElement {
    const slaveBox = screen.boundingBox;
    screen = screen.copyAndMoveAsCloseToOriginAsPossible();

    const slaveCanvas = createCanvas(screen.width, screen.height);
    const slaveCtx = slaveCanvas.getContext("2d");
    // const slaveCanvasPixels = slaveCtx.createImageData(screen.width, screen.height);

    const imgForBoundingBoxCanvas = createCanvas(
        slaveBox.width,
        slaveBox.height
    );
    const imgForBoundingBoxCtx = imgForBoundingBoxCanvas.getContext("2d");
    imgForBoundingBoxCtx.rotate(-screen.orientation);
    imgForBoundingBoxCtx.drawImage(
        imgCanvas,
        slaveBox.topLeft.x,
        slaveBox.topLeft.y,
        slaveBox.width,
        slaveBox.height,
        0,
        0,
        slaveBox.width,
        slaveBox.height
    );
    slaveCtx.drawImage(imgForBoundingBoxCanvas, 0, 0);

    // const imgPixels = imgCanvas
    //     .getContext("2d")
    //     .getImageData(
    //         screen.boundingBox.topLeft.x,
    //         screen.boundingBox.topLeft.y,
    //         screen.boundingBox.width,
    //         screen.boundingBox.height
    //     );

    // for (let y = 0; y < screen.boundingBox.height; y++) {
    //     for (let x = 0; x < screen.boundingBox.width; x++) {}
    // }

    return slaveCanvas;
}
