//TODO: import createCanvas

/**
 * 
 * @param src The path to the image that gets loaded and from which we want to analyze te correctness of the colors
 */

 //function for loading in images
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

//declare a variable 

const image = await loadImage(
        //"http://localhost:3000/images/unicorn.jpeg");

//create a canvas with which we can iterate the pixels
const imgCanvas = createCanvas(image.width, image.height);
const imgCtx = imgCanvas.getContext("2d");
imgCtx.drawImage(image, 0, 0);
var imgData = imgCanvas.getImageData(0,0,image.width,image.height);
var pixels = imgData.data;



//get the rgb-values of the pixels and calculate the distance from the correct values
for(var i=0; i<pixels.length; i+=4) {
    var red = pixels[i];
    var green = pixels[i+1];
    var blue = pixels[i+2];
    var alpha = pixels[i+3];
  }




