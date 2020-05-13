import Point from "../image_processing/screen_detection/Point";
import { ScaledToFit } from "../image_processing/camera_util";
import { PREFERRED_CANVAS_WIDTH, PREFERRED_CANVAS_HEIGHT } from "../CONSTANTS";

/**
 * Creates a new HTML canvas with the given dimensions.
 * @param width The new width.
 * @param height The new height.
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export function createCameraOverlayWithPoints(
    points: Point[],
    cameraWidth: number,
    cameraHeight: number,
    scale: number,
    scaledAlong: ScaledToFit,
    background?: any
) {
    const canvas = createCanvas(
        (PREFERRED_CANVAS_WIDTH -
            (PREFERRED_CANVAS_WIDTH - cameraWidth * scale)) /
            scale,
        (PREFERRED_CANVAS_HEIGHT -
            (PREFERRED_CANVAS_HEIGHT - cameraHeight * scale)) /
            scale
    );
    const ctx = canvas.getContext("2d");
    if (scaledAlong === ScaledToFit.HEIGHT) {
        const rescale =
            Math.abs(PREFERRED_CANVAS_WIDTH - cameraWidth) /
            scale /
            cameraWidth;
        ctx.scale(rescale, rescale);
    } else {
        const rescale =
            Math.abs(PREFERRED_CANVAS_HEIGHT - cameraHeight) /
            scale /
            cameraHeight;
        ctx.scale(rescale, rescale);
    }
    if (background) {
        ctx.drawImage(background, 0, 0);
    }
    ctx.fillStyle = "rgb(0, 255, 255)";
    points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    });
    return canvas;
}
