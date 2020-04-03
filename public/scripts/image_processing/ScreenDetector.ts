import { DetectionBlob } from "./DetectionBlob";
import { Camera } from "../jsHtml/master/camera/camera";
import { IHSLColor, IHSLRange } from "../types/Color";
import Point from "./screen_detection/Point";
import {
    getHSLColorForPixel,
    isSimilarHSLColor,
    rgbToHsl,
} from "./screen_detection/screen_detection";

export class ScreenDetector {
    previousFrame: HTMLCanvasElement;
    static detectionColor1: IHSLColor = rgbToHsl(0, 0, 255);
    static detectionColor2: IHSLColor = rgbToHsl(255, 0, 85);
    static orientationColor: IHSLColor = rgbToHsl(255, 150, 0);

    detect(
        camera: Camera,
        envColorRange: IHSLRange,
        screenColorRange1: IHSLRange,
        blobPixelMaxRange: number
    ): {
        detectionBlobs: DetectionBlob[];
        changedPixels: Point[];
        pixelsWithScreenColors: Point[];
    } {
        if (!this.previousFrame) {
            this.previousFrame = camera.snap();
            return {
                detectionBlobs: [],
                changedPixels: [],
                pixelsWithScreenColors: [],
            };
        }

        const previousFrameCtx = this.previousFrame.getContext("2d");
        const previousFramePixelData = previousFrameCtx.getImageData(
                0,
                0,
                this.previousFrame.width,
                this.previousFrame.height
            ),
            previousFramePixels = previousFramePixelData.data;

        const newFrame = camera.snap();
        const newFrameCtx = newFrame.getContext("2d");
        const newFramePixelData = newFrameCtx.getImageData(
                0,
                0,
                newFrame.width,
                newFrame.height
            ),
            newFramePixels = newFramePixelData.data;

        let detectionBlobs: DetectionBlob[] = [];
        // Pixels that are of similar color to the wanted screen.
        const screenColorPixels: Point[] = [];
        // Pixels that changed between this and the previous frame.
        const envChangePixels: Point[] = [];

        for (let y = 0; y < newFrame.height; y++) {
            for (let x = 0; x < newFrame.width; x++) {
                const prevFrameColor = getHSLColorForPixel(
                    x,
                    y,
                    this.previousFrame.width,
                    previousFramePixels
                );
                const newFrameColor = getHSLColorForPixel(
                    x,
                    y,
                    newFrame.width,
                    newFramePixels
                );
                const newFrameColorIsSimilarFromPrevFrame = isSimilarHSLColor(
                    newFrameColor,
                    prevFrameColor,
                    envColorRange
                );
                const newFrameIsColor1 = isSimilarHSLColor(
                    newFrameColor,
                    ScreenDetector.detectionColor1,
                    screenColorRange1
                );
                const newFrameIsColor2 = isSimilarHSLColor(
                    newFrameColor,
                    ScreenDetector.detectionColor2,
                    screenColorRange1
                );
                const newFrameIsOrientationColor = isSimilarHSLColor(
                    newFrameColor,
                    ScreenDetector.orientationColor,
                    screenColorRange1
                );
                const prevFrameIsColor1 = isSimilarHSLColor(
                    prevFrameColor,
                    ScreenDetector.detectionColor1,
                    screenColorRange1
                );
                const prevFrameIsColor2 = isSimilarHSLColor(
                    prevFrameColor,
                    ScreenDetector.detectionColor2,
                    screenColorRange1
                );
                const prevFrameIsOrientationColor = isSimilarHSLColor(
                    prevFrameColor,
                    ScreenDetector.orientationColor,
                    screenColorRange1
                );

                if (
                    newFrameIsColor1 ||
                    newFrameIsColor2 ||
                    newFrameIsOrientationColor
                ) {
                    screenColorPixels.push(new Point(x, y));
                }

                if (
                    !newFrameColorIsSimilarFromPrevFrame ||
                    true // TODO: Change this.
                ) {
                    envChangePixels.push(new Point(x, y));
                    if (
                        (newFrameIsColor1 && prevFrameIsColor2) ||
                        (prevFrameIsColor1 && newFrameIsColor2) ||
                        (newFrameIsOrientationColor && prevFrameIsColor1) ||
                        (newFrameIsOrientationColor && prevFrameIsColor2) ||
                        (prevFrameIsOrientationColor && newFrameIsColor1) ||
                        (prevFrameIsOrientationColor && newFrameIsColor2)
                    ) {
                        const point = new Point(x, y);
                        if (detectionBlobs.length == 0) {
                            const blob = new DetectionBlob(
                                point,
                                blobPixelMaxRange
                            );
                            blob.isOrientationBlob =
                                prevFrameIsOrientationColor ||
                                newFrameIsOrientationColor;
                            detectionBlobs.push(blob);
                        } else {
                            let foundBlob = false;
                            for (let i = 0; i < detectionBlobs.length; i++) {
                                const blob = detectionBlobs[i];
                                if (blob.isCloseEnough(point)) {
                                    blob.add(point);
                                    blob.isOrientationBlob =
                                        prevFrameIsOrientationColor ||
                                        newFrameIsOrientationColor;
                                    foundBlob = true;
                                    break;
                                }
                            }
                            if (!foundBlob) {
                                const blob = new DetectionBlob(
                                    point,
                                    blobPixelMaxRange
                                );
                                blob.isOrientationBlob =
                                    prevFrameIsOrientationColor ||
                                    newFrameIsOrientationColor;
                                detectionBlobs.push(blob);
                            }
                        }
                    }
                }
            }
        }
        this.previousFrame = newFrame;

        return {
            detectionBlobs: detectionBlobs,
            changedPixels: envChangePixels,
            pixelsWithScreenColors: screenColorPixels,
        };
    }
}
