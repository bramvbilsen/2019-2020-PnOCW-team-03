import {
    createCanvas,
    getHSLColorForPixel,
    getRGBAColorForPixel,
} from "../../scripts/image_processing/screen_detection/screen_detection";
import { loadImage } from "../../scripts/util/images";
import env from "../../env/env";
import { IHSLColor, IRGBAColor } from "../../scripts/types/Color";

async function defaultImage() {
    return await loadImage(env.baseUrl + "/images/normal.png");
}

async function colortest() {
    const img = await defaultImage();
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const nonColoredScreenCtx = <CanvasRenderingContext2D>(
        canvas.getContext("2d")
    );
    const nonColoredScreenPixelData = nonColoredScreenCtx.getImageData(
            0,
            0,
            img.width,
            img.height
        ),
        Pixels = nonColoredScreenPixelData.data; //hier hebben we de pixels
    let HSLvalues: IHSLColor[] = Array(img.width * img.height).fill({});
    let RGBvalues: IRGBAColor[] = Array(img.width * img.height).fill({});
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            HSLvalues[i * img.width + j] = getHSLColorForPixel(
                0,
                0,
                img.width,
                Pixels
            );
            RGBvalues[i * img.width + j] = getRGBAColorForPixel(
                0,
                0,
                img.width,
                Pixels
            );
        }
    }
    console.log(HSLvalues);
    console.log(RGBvalues);
}
