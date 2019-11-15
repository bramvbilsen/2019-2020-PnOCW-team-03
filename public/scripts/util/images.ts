import { BoudingBoxOfSlaveScreens } from "./BoundingBox";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";

export function scaleAndCutImageToBoundingBoxAspectRatio(
    img: HTMLCanvasElement,
    boundingBox: BoudingBoxOfSlaveScreens
): HTMLCanvasElement {
    const scale = Math.max(
        boundingBox.width / img.width,
        boundingBox.height / img.height
    );
    const canvas = createCanvas(boundingBox.width, boundingBox.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
    return canvas;
}
