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
        img.onerror = (err) => {
            reject(err);
        };
    });
}

/**
 * A function to load a video on the given path.
 * @param src The path to the video to load.
 */
export async function loadVideo(
    vid: HTMLVideoElement
): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
        vid.load();
        vid.onload = () => {
            resolve(vid);
        };
        vid.onerror = (err) => {
            reject(err);
        };
    });
}
