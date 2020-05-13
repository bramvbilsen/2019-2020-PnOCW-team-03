// From: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas

import { IHSLColor, IRGBAColor } from "../types/Color";

/**
 * Returns the IRGBAColor of the given pixel.
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param width - Width of the image.
 * @param pixels - Pixels of the image.
 */
export function getRGBAColorForPixel(
    x: number,
    y: number,
    width: number,
    pixels: Uint8ClampedArray
): IRGBAColor {
    const i = y * (width * 4) + x * 4;
    return {
        r: pixels[i],
        g: pixels[i + 1],
        b: pixels[i + 2],
        a: pixels[i + 3],
    };
}

/**
 * Returns the IHSLColor of the given pixel.
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param width - Width of the image.
 * @param pixels - Pixels of the image.
 */
export function getHSLColorForPixel(
    x: number,
    y: number,
    width: number,
    pixels: Uint8ClampedArray
): IHSLColor {
    const rgba = getRGBAColorForPixel(x, y, width, pixels);
    return rgbToHsl(rgba.r, rgba.g, rgba.b);
}

// From: https://gist.github.com/mjackson/5311256
/**
 * Transforms the given RGB values to an IHSLColor.
 * @param r The red value.
 * @param g The green value.
 * @param b The blue value.
 */
export function rgbToHsl(r: number, g: number, b: number): IHSLColor {
    (r /= 255), (g /= 255), (b /= 255);
    let max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}
