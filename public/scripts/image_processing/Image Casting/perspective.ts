/**
 * Modified version of: https://math.stackexchange.com/questions/296794/finding-the-transform-matrix-from-4-projected-points-with-javascript/339033
 */

import Point from "../screen_detection/Point";

type ILinear3x3 = [number, number, number, number, number, number, number, number, number];
type ILinear4x4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
type I3Vector = [number, number, number];

/**
 * Compute the adjugate of m
 * @param m 
 */
function adj(m: ILinear3x3): ILinear3x3 {
    return [
        m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
        m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
        m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
    ];
}

/**
 * multiply two matrices
 * @param a 
 * @param b 
 */
function multmm(a: ILinear3x3, b: ILinear3x3): ILinear3x3 {
    const c: ILinear3x3 = Array(9) as ILinear3x3;
    for (let i = 0; i != 3; ++i) {
        for (let j = 0; j != 3; ++j) {
            let cij = 0;
            for (let k = 0; k != 3; ++k) {
                cij += a[3 * i + k] * b[3 * k + j];
            }
            c[3 * i + j] = cij;
        }
    }
    return c;
}

/**
 * multiply matrix and vector
 * @param m 
 * @param v 
 */
function multmv(m: ILinear3x3, v: I3Vector): I3Vector {
    return [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
        m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
        m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
    ];
}

/**
 * 
 * @param x1 
 * @param y1 
 * @param x2 
 * @param y2 
 * @param x3 
 * @param y3 
 * @param x4 
 * @param y4 
 */
function basisToPoints(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): ILinear3x3 {
    const m: ILinear3x3 = [
        x1, x2, x3,
        y1, y2, y3,
        1, 1, 1
    ];
    const v = multmv(adj(m), [x4, y4, 1]);
    return multmm(m, [
        v[0], 0, 0,
        0, v[1], 0,
        0, 0, v[2]
    ]);
}

function general2DProjection(
    x1s: number, y1s: number, x1d: number, y1d: number,
    x2s: number, y2s: number, x2d: number, y2d: number,
    x3s: number, y3s: number, x3d: number, y3d: number,
    x4s: number, y4s: number, x4d: number, y4d: number
) {
    const s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
    const d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
    return multmm(d, adj(s));
}

export default function create3DMatrix(srcPoints: [Point, Point, Point, Point], dstPoints: [Point, Point, Point, Point]) {
    const proj2d = general2DProjection(
        srcPoints[0].x, srcPoints[0].y, dstPoints[0].x, dstPoints[0].y,
        srcPoints[1].x, srcPoints[1].y, dstPoints[1].x, dstPoints[1].y,
        srcPoints[2].x, srcPoints[2].y, dstPoints[2].x, dstPoints[2].y,
        srcPoints[3].x, srcPoints[3].y, dstPoints[3].x, dstPoints[3].y,
    );
    for (let i = 0; i != 9; ++i) proj2d[i] = proj2d[i] / proj2d[8];
    const proj3d: ILinear4x4 = [
        proj2d[0], proj2d[3], 0, proj2d[6],
        proj2d[1], proj2d[4], 0, proj2d[7],
        0, 0, 1, 0,
        proj2d[2], proj2d[5], 0, proj2d[8]
    ];
    return "matrix3d(" + proj3d.join(", ") + ")";
}