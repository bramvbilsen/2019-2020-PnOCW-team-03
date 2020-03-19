const linSystem = require("linear-equation-system");
import Point from "../screen_detection/Point";

export default function perspectiveMatrix(begin: Point[], end: Point[]) {
    let x0 = begin[0].x;
    let y0 = begin[0].y;
    let x1 = begin[1].x;
    let y1 = begin[1].y;
    let x2 = begin[2].x;
    let y2 = begin[2].y;
    let x3 = begin[3].x;
    let y3 = begin[3].y;
    let u0 = end[0].x;
    let v0 = end[0].y;
    let u1 = end[1].x;
    let v1 = end[1].y;
    let u2 = end[2].x;
    let v2 = end[2].y;
    let u3 = end[3].x;
    let v3 = end[3].y;
    let row1 = [x0, y0, 1, 0, 0, 0, -u0 * x0, -u0 * y0];
    let row2 = [0, 0, 0, x0, y0, 1, -v0 * x0, -v0 * y0];
    let row3 = [x1, y1, 1, 0, 0, 0, -u1 * x1, -u1 * y1];
    let row4 = [0, 0, 0, x1, y1, 1, -v1 * x1, -v1 * y1];
    let row5 = [x2, y2, 1, 0, 0, 0, -u2 * x2, -u2 * y2];
    let row6 = [0, 0, 0, x2, y2, 1, -v2 * x2, -v2 * y2];
    let row7 = [x3, y3, 1, 0, 0, 0, -u3 * x3, -u3 * y3];
    let row8 = [0, 0, 0, x3, y3, 1, -v3 * x3, -v3 * y3];

    let c = [u0, v0, u1, v1, u2, v2, u3, v3];

    let matrix = [row1, row2, row3, row4, row5, row6, row7, row8];

    let h: number[] = linSystem.solve(matrix, c);
    console.log(h);
    let matrix3d =
        "matrix3d( " +
        h[0] +
        ", " +
        h[3] +
        ", " +
        0 +
        ", " +
        h[6] +
        ", " +
        h[1] +
        ", " +
        h[4] +
        ", " +
        0 +
        ", " +
        h[7] +
        ", " +
        0 +
        ", " +
        0 +
        ", " +
        1 +
        ", " +
        0 +
        ", " +
        h[2] +
        ", " +
        h[5] +
        ", " +
        0 +
        ", " +
        1 +
        " )";

    console.log(matrix3d);

    return matrix3d;
}

// testPerspective();

// function testPerspective() {
//     const width = 900;
//     const height = 900;

//     const htmlImg = document.createElement("img");
//     htmlImg.src =
//         "https://sterlingathletics.com/wp-content/uploads/2015/10/Traditional-Hand-Sewn-Soccer-Ball.png";
//     htmlImg.width = width;
//     htmlImg.height = height;
//     //document.getElementsByTagName("body")[0].appendChild(htmlImg);

//     const src = [
//         { x: 0, y: 112.5 },
//         { x: width, y: 67.5 },
//         { x: 582.75, y: height },
//         { x: 0, y: 468 },
//     ];

//     // const dest = smallestSurroundingRectangle(src);
//     // console.log(dest);

//     const css3dMatrix = test(src, [
//         { x: 0, y: 0 },
//         { x: window.innerWidth, y: 0 },
//         { x: window.innerWidth, y: window.innerHeight },
//         { x: 0, y: window.innerHeight },
//     ]);
//     console.log(window.innerWidth);

//     console.log(css3dMatrix);

//     // const ctx_orig_img = newCanvasToScreen("orig-img-canvas", width, height);
//     // ctx_orig_img.drawImage(htmlImg, 0, 0, width, height);
//     // drawRectStroke(ctx_orig_img, src, "blue");
//     // drawPoints(ctx_orig_img, src, "blue");
//     // drawRectStroke(ctx_orig_img, dest, "red");
//     // drawPoints(ctx_orig_img, dest, "red");

//     const ctx_cut_img = newCanvasToScreen("cut-img-canvas", width, height);
//     ctx_cut_img.drawImage(htmlImg, 0, 0, width, height);
//     document.getElementById("cut-img-canvas").style.transformOrigin = "0 0";
//     document.getElementById("cut-img-canvas").style.transform = css3dMatrix;
//     // drawRectStroke(ctx_orig_img, src, "blue");
//     // drawPoints(ctx_orig_img, src, "blue");
//     // drawRectStroke(ctx_orig_img, dest, "red");
//     // drawPoints(ctx_orig_img, dest, "red");
// }
