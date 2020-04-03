import { client } from "../../index";
import SlaveScreen from "../util/SlaveScreen";
import { Camera } from "../jsHtml/master/camera/camera";
import {
    CameraOverlay,
    CameraEnvironmentChangeOverlay,
    CameraScreenColorsOverlay,
} from "../jsHtml/master/camera/cameraOverlays";
import { DetectionBlob } from "./DetectionBlob";
import { ScreenDetector } from "./ScreenDetector";
import {
    SettingSlidersEnv,
    SettingsSlidersScreen,
    SettingsSlidersBlobRange,
} from "../jsHtml/master/camera/settings/slidersRanges";

/**
 * Wait for the given amount of time.
 * @param dt This is the deltaTime between the start and end of the wait.
 */
export async function wait(dt: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), dt);
    });
}

export default class SlaveFlowHandler {
    slaveIDs: string[];
    screens: SlaveScreen[] = [];
    camera: Camera;

    constructor(camera: Camera) {
        this.slaveIDs = client.slaves;
        this.camera = camera;
    }

    detect() {
        const blobsToFindCount = 5;

        const cameraOverlay = new CameraOverlay();
        const cameraEnvChangeOverlay = new CameraEnvironmentChangeOverlay();
        const cameraScreenColorsOverlay = new CameraScreenColorsOverlay();
        const settingsSlidersEnv = new SettingSlidersEnv();
        const settingsSlidersScreen = new SettingsSlidersScreen();
        const settingsSlidersBlobRange = new SettingsSlidersBlobRange();
        const cameraOverlayCtx = cameraOverlay.elem.getContext("2d");
        const screenDetector = new ScreenDetector();
        let detectionBlobs: DetectionBlob[] = [];

        let canDetectAgain = true;
        setInterval(() => {
            if (!canDetectAgain) {
                return;
            }
            cameraOverlay.clear();

            const {
                detectionBlobs: newDetectionBlobs,
                changedPixels,
                pixelsWithScreenColors,
            } = screenDetector.detect(
                this.camera,
                settingsSlidersEnv.toHSLRange(),
                settingsSlidersScreen.toHSLRange(),
                settingsSlidersBlobRange.value
            );

            if (newDetectionBlobs.length >= blobsToFindCount) {
                detectionBlobs = newDetectionBlobs
                    .sort((blob_a, blob_b) => blob_b.area - blob_a.area)
                    .slice(0, blobsToFindCount);
            }

            if (
                cameraEnvChangeOverlay.isHidden() &&
                cameraScreenColorsOverlay.isHidden()
            ) {
                detectionBlobs.forEach(blob => {
                    blob.draw(cameraOverlayCtx, "");
                });
            } else if (!cameraEnvChangeOverlay.isHidden()) {
                const ctx = cameraEnvChangeOverlay.elem.getContext("2d");
                ctx.clearRect(
                    0,
                    0,
                    cameraEnvChangeOverlay.width,
                    cameraEnvChangeOverlay.height
                );
                ctx.fillStyle = "white";
                changedPixels.forEach(pixel =>
                    ctx.fillRect(pixel.x, pixel.y, 1, 1)
                );
            } else if (!cameraScreenColorsOverlay.isHidden()) {
                const ctx = cameraScreenColorsOverlay.elem.getContext("2d");
                ctx.clearRect(
                    0,
                    0,
                    cameraScreenColorsOverlay.width,
                    cameraScreenColorsOverlay.height
                );
                ctx.fillStyle = "white";
                pixelsWithScreenColors.forEach(pixel =>
                    ctx.fillRect(pixel.x, pixel.y, 1, 1)
                );
            }
            canDetectAgain = true;
        }, 0);
    }
}
