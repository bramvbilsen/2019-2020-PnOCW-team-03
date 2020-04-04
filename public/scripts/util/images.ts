import { BoundingBox } from "./BoundingBox";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";

/**
 * A function to load an image on the given path.
 * @param src The path to the image to load.
 */
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
 * A function to load a video on the given path.
 * @param src The path to the video to load.
 */
export async function loadVideo(src: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
        const vid = new HTMLVideoElement();
        vid.src = src;
        vid.onload = () => {
            resolve(vid);
        };
        vid.onerror = err => {
            reject(err);
        };
    });
}

//Fixme What does this function do?
export function scaleAndCutBoundingBoxToImgAspectRatio(
    img: HTMLHtmlElement,
    globalBoundingBox: BoundingBox
) {
    const canvas = createCanvas(img.clientWidth, img.clientHeight);
    const ctx = canvas.getContext("2d");
}
