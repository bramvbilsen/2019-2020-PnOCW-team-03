import { BoundingBox } from "./BoundingBox";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";

export async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            resolve(img);
        };
        img.onerror = err => {
            reject(err);
        };
    });
}

/**
 * Returns a canvas with `img` scaled to the dimensions of `boundingBox`. Scaled to fill!
 * @param img
 *
 * @param globalBoundingBox Bounding box around all screens.
 */
export function scaleAndCutImageToBoundingBoxAspectRatio(
    img: HTMLCanvasElement,
    globalBoundingBox: BoundingBox
): HTMLCanvasElement {
    const canvas = createCanvas(
        globalBoundingBox.width,
        globalBoundingBox.height
    );
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, globalBoundingBox.width, globalBoundingBox.height);
    $("#test-results-visual").attr("src", canvas.toDataURL());
    return canvas;
}

export function scaleAndCutBoundingBoxToImgAspectRatio(
    img: HTMLHtmlElement,
    globalBoundingBox: BoundingBox): HTMLHtmlCanvasElement {
    const canvas = createCanvas(img.clientWidth, img.clientHeight);
    const ctx = canvas.getContext("2d");

}


