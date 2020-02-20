// Implementation of algorithm as described here: https://gis.stackexchange.com/questions/22895/finding-minimum-area-rectangle-for-given-points
// Other source with some papers: https://geidav.wordpress.com/2014/01/23/computing-oriented-minimum-bounding-boxes-in-2d/

// TODO: Something is wrong with rotating polygons. This causes the smallest surrounding rectangle to shift incorrectly.
// TODO: Implementation was done in another environment thus functions previously written might reduce code here.
// TODO: Typescript.

const radius = 5;
const origPoints = [
  {x: 50, y: 90},
  {x: 150, y: 50},
  {x: 250, y: 100},
  {x: 200, y: 200},
  {x: 100, y: 200}
];
const origPointsCopy = [
  {x: 50, y: 90},
  {x: 150, y: 50},
  {x: 250, y: 100},
  {x: 200, y: 200},
  {x: 100, y: 200}
];


const canvas = document.createElement("canvas");
canvas.width = 350;
canvas.height = 250;
const ctx = canvas.getContext("2d");
document.getElementsByTagName("body")[0].appendChild(canvas);

function drawPoints(points, color) {
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath()
    ctx.arc(points[i].x, points[i].y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color ? color : "red";
    ctx.fill();
    ctx.closePath();
  }
}

function drawRect(a, b, c, d, color) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.lineTo(a.x, a.y);
  ctx.fillStyle = color ? color : "blue";
  ctx.fill();
  ctx.closePath();
}

function drawRectStroke(points, color) {
  for (let j = 0; j < points.length; j++) {
    const x0 = points[j].x;
    const y0 = points[j].y;
    let x1;
    let y1;
    if (j + 1 < points.length) {
      x1 = points[j+1].x;
      y1 = points[j+1].y;
    } else {
      x1 = points[0].x;
      y1 = points[0].y;
    }
    drawLine({
      a: {x: x0, y: y0}, 
      b: {x: x1, y: y1}
    }, color);
  }
}

function drawLine(line, color) {
    ctx.beginPath();
    ctx.moveTo(line.a.x, line.a.y);
    ctx.lineTo(line.b.x, line.b.y);
    ctx.strokeStyle = color ? color : "blue";
    ctx.stroke();
    ctx.closePath();
}

function drawLines(lines, color) {
    for (let i = 0; i< lines.length; i++) {
      drawLine(lines[i], color);
    }
}

// minPoint is defined as (x_min, y_min).
function calcMinPoint(points) {
  let minX = Infinity;
  let minY = Infinity;
  points.forEach(({x, y}) => {
    minX = minX > x ? x : minX;
    minY = minY > y ? y : minY;
  });
  return {x: minX, y: minY};
}

// minPoint is defined as (x_min, y_min).
function calcMaxPoint(points) {
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach(({x, y}) => {
    maxX = maxX < x ? x : maxX;
    maxY = maxY < y ? y : maxY;
  });
  return {x: maxX, y: maxY};
}

function rotatePointAroundAnchor(
    pointToRotate,
    anchorPoint,
    angle
) {
    if (angle === 0) return {x: pointToRotate.x, y: pointToRotate.y};
    const rotatedX =
        Math.cos(angle) * (pointToRotate.x - anchorPoint.x) -
        Math.sin(angle) * (pointToRotate.y - anchorPoint.y) +
        anchorPoint.x;

    const rotatedY =
        Math.sin(angle) * (pointToRotate.x - anchorPoint.x) +
        Math.cos(angle) * (pointToRotate.y - anchorPoint.y) +
        anchorPoint.y;

    return {x: rotatedX, y: rotatedY};
}

function getConvexPolygonCentroid(points) {
  let sumX = 0;
  let sumY = 0;
  points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
  });
  return {
    x: Math.round(sumX / points.length),
    y: Math.round(sumY / points.length)
  };
}

function rotateConvexPolygonAroundCenter(points, angle) {
  const centroid = getConvexPolygonCentroid(points);
  const newPoints = [];
  for (let i = 0; i < points.length; i++) {
    newPoints.push(rotatePointAroundAnchor(points[i], centroid, angle));
  }
  return newPoints;
}

function calcMinimumBoundingBox(points) {
  const convexHullPoints = convexHull(points);
  const convexHullEdges = [];
  for (let i = 0; i < convexHullPoints.length; i++) {
    const x0 = convexHullPoints[i].x;
    const y0 = convexHullPoints[i].y;
    if (i + 1 < convexHullPoints.length) {
      convexHullEdges.push({
        a: {x: x0, y: y0}, 
        b: {x: convexHullPoints[i+1].x, y: convexHullPoints[i+1].y}
      });
    } else {
      convexHullEdges.push({
        a: {x: x0, y: y0}, 
        b: {x: convexHullPoints[0].x, y: convexHullPoints[0].y}
      });
    }
  }


  let smallestArea = Infinity;
  let angle = Infinity;
  let rotatedCH;
  let minimumBoundingBox;
  for (let i = 0; i < convexHullEdges.length; i++) {
    const edgeAngle = Math.atan2(
      convexHullEdges[i].b.y - convexHullEdges[i].a.y,
      convexHullEdges[i].b.x - convexHullEdges[i].a.x
    );
    
    const rotatedConvexHull = rotateConvexPolygonAroundCenter(convexHullPoints, edgeAngle);
    console.log("Hull rotation: " + (edgeAngle * (180 / Math.PI)) + "deg");
    const minPoint = calcMinPoint(rotatedConvexHull);
    const maxPoint = calcMaxPoint(rotatedConvexHull);
    const area = (maxPoint.x - minPoint.x) * (maxPoint.y - minPoint.y);
    
    if (area < smallestArea) {
      rotatedCH = rotatedConvexHull;
      angle = edgeAngle;
      minimumBoundingBox = [
        {x: minPoint.x, y: minPoint.y}, {x: minPoint.x, y: maxPoint.y}, {x: maxPoint.x, y: minPoint.y}, {x: maxPoint.x, y: maxPoint.y}
      ]
    }
  }
  return rotateConvexPolygonAroundCenter(minimumBoundingBox, -angle);
}


const minBoundingBox = calcMinimumBoundingBox(origPointsCopy);
drawRect(minBoundingBox[1], minBoundingBox[0], minBoundingBox[2], minBoundingBox[3]);

drawPoints(origPoints, "red");
drawRectStroke(origPoints, "red");