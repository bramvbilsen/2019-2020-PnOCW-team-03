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
// export function scaleAndCutImageToBoundingBoxAspectRatio(
//     img: HTMLCanvasElement,
//     globalBoundingBoxWidth: number,
//     globalBoundingBoxHeight: number
// ): HTMLCanvasElement {
//     const imgCanvas = createCanvas(
//         globalBoundingBoxWidth,
//         globalBoundingBoxHeight
//     );
//     const imgCtx = imgCanvas.getContext("2d");
//     imgCtx.drawImage(
//         img,
//         0,
//         0,
//         globalBoundingBoxWidth,
//         globalBoundingBoxHeight
//     );
//     const canvas = createCanvas(
//         globalBoundingBoxWidth + extraWidth,
//         globalBoundingBoxHeight + extraHeight
//     );
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(imgCanvas, extraWidth / 2, extraHeight / 2);
//     return canvas;
// }

export function scaleAndCutBoundingBoxToImgAspectRatio(
    img: HTMLHtmlElement,
    globalBoundingBox: BoundingBox
) {
    const canvas = createCanvas(img.clientWidth, img.clientHeight);
    const ctx = canvas.getContext("2d");
}
