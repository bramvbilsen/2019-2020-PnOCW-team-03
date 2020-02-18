import {
    createCanvas,
    getHSLColorForPixel,
    getRGBAColorForPixel,
} from "../../scripts/image_processing/screen_detection/screen_detection";
import { loadImage } from "../../scripts/util/images";
import env from "../../env/env";
import { IHSLColor, IRGBAColor } from "../../scripts/types/Color";

export async function colortest(r: number, g: number, b: number) {
    const img = await loadImage(env.baseUrl + "/images/b.jpeg");
    const canvas = createCanvas(img.width, img.height);
    const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const nonColoredScreenPixelData = ctx.getImageData(
            0,
            0,
            img.width,
            img.height
        ),
        Pixels = nonColoredScreenPixelData.data; //hier hebben we de pixels
    let HSLoffsets = 0;
    let Roffsets = 0;
    let Goffsets = 0;
    let Boffsets = 0;
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let RGB = getRGBAColorForPixel(0, 0, img.width, Pixels);
            Roffsets += Math.abs(RGB.r - r);
            Goffsets += Math.abs(RGB.g - g);
            Boffsets += Math.abs(RGB.b - b);
        }
    }
    let len = img.height * img.width;
    Roffsets /= len;
    Goffsets /= len;
    Boffsets /= len;
    console.log("r offset is " + Roffsets);
    console.log("g offset is " + Goffsets);
    console.log("b offset is " + Boffsets);
}
