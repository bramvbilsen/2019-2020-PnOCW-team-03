//@ts-ignore
const transform = window.transform;
const srcpoints = [50, 50, 150, 50, 50, 150, 150, 150];
const dstpoints = [0, 0, 30, 0, 0, 30, 30, 30];
//var canvas = createCanvas(200, 200);
var canvas = document.getElementById("canvas")
transform(canvas, srcpoints, dstpoints)
console.log(1)

function createCanvas(width : number, height : number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}