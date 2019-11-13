/**
 * Returns the scale factor for the camera snapshot to fit as large as possible in the canvas.
 * @param cameraWidth
 * @param cameraHeight
 * @param canvasWidth
 * @param canvasHeight
 */
export function calculateCameraCanvasScaleFactor(
    cameraWidth: number,
    cameraHeight: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const temp_scale = canvasWidth / cameraWidth;
    let scale = canvasHeight / cameraHeight;
    return (scale = scale > temp_scale ? temp_scale : scale);
}
