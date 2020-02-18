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
<<<<<<< HEAD

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
=======
//declare a variable 
const image = await loadImage(
        //"http://localhost:3000/images/unicorn.jpeg");
//create a canvas with which we can iterate the pixels
const imgCanvas = createCanvas(image.width, image.height);
const imgCtx = imgCanvas.getContext("2d");
imgCtx.drawImage(image, 0, 0);
var imgData = imgCanvas.getImageData(0, 0, image.width, image.height);
var pixels = imgData.data;
//get the rgb-values of the pixels and calculate the distance from the correct values
for (var i = 0; i < pixels.length; i += 4) {
    var red = pixels[i];
    var green = pixels[i + 1];
    var blue = pixels[i + 2];
    var alpha = pixels[i + 3];
}
<<<<<<< HEAD
*/
=======


*/

>>>>>>> d6e014c32497e9d0a28b642e206636fbbbeeae36
>>>>>>> ea78b9414ad34457621cdf7613b0b8e1496c5731
