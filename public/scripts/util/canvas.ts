import { createCanvas } from "../image_processing/screen_detection/screen_detection";

export function copyCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    const cv = createCanvas(canvas.width, canvas.height);
    cv.getContext("2d").putImageData(ctx.getImageData(0, 0, canvas[0].width, canvas[0].height), 0, 0);
    return cv;
}