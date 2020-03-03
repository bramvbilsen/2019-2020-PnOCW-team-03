import {
    createCanvas,
    getHSLColorForPixel,
    getRGBAColorForPixel,
} from "../../scripts/image_processing/screen_detection/screen_detection";
import { loadImage } from "../../scripts/util/images";
import env from "../../env/env";
import { IHSLColor, IRGBAColor } from "../../scripts/types/Color";

export async function colortest(
    r: number,
    g: number,
    b: number,
    h: number,
    s: number,
    l: number
) {
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
    //ook met gewone waarden werken
    let RGBv = {
        mean: {
            R: 0,
            G: 0,
            B: 0,
        },
        meadian: {
            R: 0,
            G: 0,
            B: 0,
        },
    };
    let HSLv = {
        mean: {
            H: 0,
            S: 0,
            L: 0,
        },
        meadian: {
            H: 0,
            S: 0,
            L: 0,
        },
    };
    let HSLoffsets = {
        real: {
            mean: {
                Hoffsets: 0,
                Soffsets: 0,
                Loffsets: 0,
            },
            median: {
                Hoffsets: 0,
                Soffsets: 0,
                Loffsets: 0,
            },
        },
        absolute: {
            mean: {
                Hoffsets: 0,
                Soffsets: 0,
                Loffsets: 0,
            },
            median: {
                Hoffsets: 0,
                Soffsets: 0,
                Loffsets: 0,
            },
        },
    };
    let RGBoffsets = {
        real: {
            mean: {
                Roffsets: 0,
                Goffsets: 0,
                Boffsets: 0,
            },
            median: {
                Roffsets: 0,
                Goffsets: 0,
                Boffsets: 0,
            },
        },
        absolute: {
            mean: {
                Roffsets: 0,
                Goffsets: 0,
                Boffsets: 0,
            },
            median: {
                Roffsets: 0,
                Goffsets: 0,
                Boffsets: 0,
            },
        },
    };
    let len = img.height * img.width;
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let RGB = getRGBAColorForPixel(0, 0, img.width, Pixels);
            RGBv.mean.R += RGB.r;
            RGBv.mean.G += RGB.g;
            RGBv.mean.B += RGB.b;
            let Roff = RGB.r - r;
            let Goff = RGB.g - g;
            let Boff = RGB.b - b;
            let Roffabs = Math.abs(Roff);
            let Goffabs = Math.abs(Goff);
            let Boffabs = Math.abs(Boff);
            RGBoffsets.real.mean.Roffsets += Roff;
            RGBoffsets.real.mean.Goffsets += Goff;
            RGBoffsets.real.mean.Boffsets += Boff;
            RGBoffsets.absolute.mean.Roffsets += Roffabs;
            RGBoffsets.absolute.mean.Goffsets += Goffabs;
            RGBoffsets.absolute.mean.Boffsets += Boffabs;
            let HSL = getHSLColorForPixel(0, 0, img.width, Pixels);
            HSLv.mean.H += HSL.h;
            HSLv.mean.S += HSL.s;
            HSLv.mean.L += HSL.l;
            let Hoff = HSL.h - h;
            let Soff = HSL.s - s;
            let Loff = HSL.l - l;
            let Hoffabs = Math.abs(Hoff);
            let Soffabs = Math.abs(Soff);
            let Loffabs = Math.abs(Loff);
            HSLoffsets.real.mean.Hoffsets += Hoff;
            HSLoffsets.real.mean.Soffsets += Soff;
            HSLoffsets.real.mean.Loffsets += Loff;
            HSLoffsets.absolute.mean.Hoffsets += Hoffabs;
            HSLoffsets.absolute.mean.Soffsets += Soffabs;
            HSLoffsets.absolute.mean.Loffsets += Loffabs;
        }
    }
    RGBv.mean.R /= len;
    RGBv.mean.G /= len;
    RGBv.mean.B /= len;
    HSLv.mean.H /= len;
    HSLv.mean.S /= len;
    HSLv.mean.L /= len;
    RGBoffsets.real.mean.Roffsets /= len;
    RGBoffsets.real.mean.Goffsets /= len;
    RGBoffsets.real.mean.Boffsets /= len;
    RGBoffsets.absolute.mean.Roffsets /= len;
    RGBoffsets.absolute.mean.Goffsets /= len;
    RGBoffsets.absolute.mean.Boffsets /= len;
    HSLoffsets.real.mean.Hoffsets /= len;
    HSLoffsets.real.mean.Soffsets /= len;
    HSLoffsets.real.mean.Loffsets /= len;
    HSLoffsets.absolute.mean.Hoffsets /= len;
    HSLoffsets.absolute.mean.Soffsets /= len;
    HSLoffsets.absolute.mean.Loffsets /= len;
    console.log("r mean " + RGBv.mean.R);
    console.log("g mean " + RGBv.mean.G);
    console.log("b mean " + RGBv.mean.B);
    console.log("real mean r offset is " + RGBoffsets.real.mean.Roffsets);
    console.log("real mean g offset is " + RGBoffsets.real.mean.Goffsets);
    console.log("real mean b offset is " + RGBoffsets.real.mean.Boffsets);
    console.log(
        "absolute mean r offset is " + RGBoffsets.absolute.mean.Roffsets
    );
    console.log(
        "absolute mean g offset is " + RGBoffsets.absolute.mean.Goffsets
    );
    console.log(
        "absolute mean b offset is " + RGBoffsets.absolute.mean.Boffsets
    );
    console.log("h mean " + HSLv.mean.H);
    console.log("s mean " + HSLv.mean.S);
    console.log("l mean " + HSLv.mean.L);
    console.log("real mean h offset is " + HSLoffsets.real.mean.Hoffsets);
    console.log("real mean s offset is " + HSLoffsets.real.mean.Soffsets);
    console.log("real mean l offset is " + HSLoffsets.real.mean.Loffsets);
    console.log(
        "absolute mean h offset is " + HSLoffsets.absolute.mean.Hoffsets
    );
    console.log(
        "absolute mean s offset is " + HSLoffsets.absolute.mean.Soffsets
    );
    console.log(
        "absolute mean l offset is " + HSLoffsets.absolute.mean.Loffsets
    );
}
