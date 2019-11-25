
// Computes the matrix3d that maps src points to dst.
function computeTransform(src: number[][], dst : number[][]) {
  // src and dst should have length 4 each
  let count = 4;
  let a = []; // (2*count) x 8 matrix
  let b = []; // (2*count) vector

  for (let i = 0; i < 2 * count; ++i) {
    a.push([0, 0, 0, 0, 0, 0, 0, 0]);
    b.push(0);
  }

  for (let i = 0; i < count; ++i) {
    let j = i + count;
    a[i][0] = a[j][3] = src[i][0];
    a[i][1] = a[j][4] = src[i][1];
    a[i][2] = a[j][5] = 1;
    a[i][3] = a[i][4] = a[i][5] =
      a[j][0] = a[j][1] = a[j][2] = 0;
    a[i][6] = -src[i][0] * dst[i][0];
    a[i][7] = -src[i][1] * dst[i][0];
    a[j][6] = -src[i][0] * dst[i][1];
    a[j][7] = -src[i][1] * dst[i][1];
    b[i] = dst[i][0];
    b[j] = dst[i][1];
  }

  let x = numeric.solve(a, b);
  // matrix3d is homogeneous coords in column major!
  // the z coordinate is unused
  let m = [
    x[0], x[3],   0, x[6],
    x[1], x[4],   0, x[7],
       0,    0,   1,    0,
    x[2], x[5],   0,    1
  ];
  let transform = "matrix3d(";
  for (let i = 0; i < m.length - 1; ++i) {
    transform += m[i] + ", ";
  }
  transform += m[15] + ")";
  return transform;
}

// Collect the four corners
let dst = [[133, 12],[ 221, 49], [166, 184], [79, 148]];
let src = [[0, 0], [300, 0], [300, 200], [0, 200]];
  if (dst.length == 4) {
    // Once we have all corners, compute the transform.
    let img = <HTMLCanvasElement> document.getElementById('canvas');
    let w = img.width,
        h = img.height;
    let transform = computeTransform(
      dst,
      src
    );
    
    document.getElementById('canvas').style.transformOrigin = '0 0';
    document.getElementById('canvas').style.transform = transform;

  }
 