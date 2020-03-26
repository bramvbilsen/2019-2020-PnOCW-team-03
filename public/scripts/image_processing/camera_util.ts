export enum ScaledToFit {
    WIDTH = "width",
    HEIGHT = "height",
}

/**
 * Returns the scale factor for the camera snapshot to fit as large as possible in the canvas.
 * @param cameraWidth The width of the camera snapshot.
 * @param cameraHeight The height of the camera snapshot.
 * @param canvasWidth The width of the canvas.
 * @param canvasHeight The height of the canvas.
 */
export function calculateCameraCanvasScaleFactor(
    cameraWidth: number,
    cameraHeight: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const widthScale = canvasWidth / cameraWidth;
    let heightScale = canvasHeight / cameraHeight;
    if (heightScale > widthScale) {
        return {
            scale: widthScale,
            along: ScaledToFit.WIDTH,
        };
    } else {
        return {
            scale: heightScale,
            along: ScaledToFit.HEIGHT,
        };
    }
}
