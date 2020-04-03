import HtmlElem from "../../HtmlElem";
import {
    CameraOverlay,
    CameraEnvironmentChangeOverlay,
    CameraScreenColorsOverlay,
} from "./cameraOverlays";
import { createCanvas } from "../../../image_processing/screen_detection/screen_detection";

export class Camera extends HtmlElem {
    preferredResolutionWidth = 480;
    preferredResolutionHeight = 360;

    get elem(): HTMLVideoElement {
        return document.querySelector("#camera");
    }

    private addOverlays() {
        const elem = this.elem;
        const videoWidth = elem.videoWidth;
        const videoHeight = elem.videoHeight;
        const cameraOverlay = new CameraOverlay();
        const cameraEnvOverlay = new CameraEnvironmentChangeOverlay();
        const cameraScreenColorsOverlay = new CameraScreenColorsOverlay();
        cameraOverlay.width = videoWidth;
        cameraEnvOverlay.width = videoWidth;
        cameraScreenColorsOverlay.width = videoWidth;
        cameraOverlay.height = videoHeight;
        cameraEnvOverlay.height = videoHeight;
        cameraScreenColorsOverlay.height = videoHeight;
    }

    async start(): Promise<void> {
        const video = this.elem;

        if (navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: { max: this.preferredResolutionWidth },
                        height: { max: this.preferredResolutionHeight },
                    },
                });
                video.srcObject = stream;
                return new Promise((resolve, _) => {
                    video.oncanplay = () => {
                        this.addOverlays();
                        resolve();
                    };
                });
            } catch (e) {
                return new Promise((_, rej) => rej(e));
            }
        } else {
            return new Promise((_, rej) => rej("Could not get user media..."));
        }
    }

    snap(): HTMLCanvasElement {
        const elem = this.elem;
        const videoWidth = elem.videoWidth;
        const videoHeight = elem.videoHeight;
        const canvas = createCanvas(videoWidth, videoHeight);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(elem, 0, 0);
        return canvas;
    }
}
