import Point from "./screen_detection/Point";
import { Camera } from "../UI/Master/Camera";
import { orientation } from "./screen_detection/hull";
import { CameraOverlay } from "../UI/Master/cameraOverlays";
import { median } from "../util/arrays";
import Line from "./screen_detection/Line";
const { checkIntersection } = require("line-intersect");

export function findAreaCorners(
    area: Point[],
    camera: Camera,
    width: number,
    height: number
) {
    const foundScreenImgData = new ImageData(width, height);
    const foundScreenPixels = foundScreenImgData.data;
    const maxPercentageFromCorner = 0.2;

    area.forEach((pixel) => {
        const i = pixel.y * (width * 4) + pixel.x * 4;
        foundScreenPixels[i] = 255;
        foundScreenPixels[i + 1] = 255;
        foundScreenPixels[i + 2] = 255;
    });

    camera.applyBigGaussianBlur(foundScreenImgData);
    camera.applySharpen(foundScreenImgData);
    let points = camera.applySobelEdgeFilter(foundScreenImgData);

    const xValues = points.map((p) => p.x);
    const yValues = points.map((p) => p.y);

    let p1: Point;
    const xMedian =
        xValues.length % 2 !== 0
            ? xValues[Math.floor(xValues.length / 2)]
            : (xValues[Math.floor(xValues.length / 2) - 1] +
                  xValues[Math.floor(xValues.length / 2)]) /
              2;
    const yMedian =
        yValues.length % 2 !== 0
            ? yValues[Math.floor(yValues.length / 2)]
            : (yValues[Math.floor(yValues.length / 2) - 1] +
                  yValues[Math.floor(yValues.length / 2)]) /
              2;
    const medianPoint = new Point(xMedian, yMedian);
    let maxDist = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = p.distanceSq(medianPoint);
        if (dist > maxDist) {
            maxDist = dist;
            p1 = p;
        }
    }

    if (!p1) {
        return [];
    }

    const pointsSortedFromP1 = points
        .sort((a, b) => {
            const o = orientation(p1, a, b);
            if (o === 0) return p1.distanceTo(b) >= p1.distanceTo(a) ? -1 : 1;
            return o === 2 ? -1 : 1;
        })
        .filter((p) => p != p1);
    const pointsSortedFromP1Reversed = pointsSortedFromP1.reverse();
    // const

    let p2: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = p.distanceSq(p1);
        if (dist > maxDist) {
            maxDist = dist;
            p2 = p;
        }
    }

    if (!p2) {
        return [p1];
    }

    // const centerP1P2 = new Point(
    //     p2.x + (p1.x - p2.x) / 2,
    //     p2.y + (p1.y - p2.y) / 2
    // );

    // let p3: Point;
    // maxDist = 0;
    // for (let i = 0; i < points.length; i++) {
    //     const p = points[i];
    //     const dist = p.distanceSq(centerP1P2);
    //     if (dist > maxDist && !p.equals(p1) && !p.equals(p2)) {
    //         if (
    //             Math.abs(
    //                 Math.atan2(p.y - p1.y, p.x - p1.x) -
    //                     Math.atan2(p2.y - p1.y, p2.x - p1.x)
    //             ) >
    //                 (20 * Math.PI) / 180 &&
    //             Math.abs(
    //                 Math.atan2(p.y - p2.y, p.x - p2.x) -
    //                     Math.atan2(p1.y - p2.y, p1.x - p2.x)
    //             ) >
    //                 (20 * Math.PI) / 180
    //         ) {
    //             maxDist = dist;
    //             p3 = p;
    //         }
    //     }
    // }

    // if (!p3) {
    //     return [p1, p2];
    // }

    // let p4: Point;
    // maxDist = 0;
    // for (let i = 0; i < points.length; i++) {
    //     const p = points[i];
    //     const dist = p.distanceSq(p3);
    //     if (dist > maxDist && !p.equals(p1) && !p.equals(p2) && !p.equals(p3)) {
    //         maxDist = dist;
    //         p4 = p;
    //     }
    // }

    // if (!p4) {
    //     return [p1, p2, p3];
    // }

    // return [p1, p2, p3, p4];

    // NEW CORNER DETECTION

    const pointsSortedFromP1X = pointsSortedFromP1
        .slice(0, pointsSortedFromP1.length * maxPercentageFromCorner)
        .sort((a, b) => a.x - b.x)
        .map((p) => p.x);
    const pointsSortedFromP1Y = pointsSortedFromP1
        .slice(0, pointsSortedFromP1.length * maxPercentageFromCorner)
        .sort((a, b) => a.y - b.y)
        .map((p) => p.y);
    const pointsSortedFromP1XReversed = pointsSortedFromP1Reversed
        .slice(
            pointsSortedFromP1Reversed.length -
                pointsSortedFromP1Reversed.length * maxPercentageFromCorner,
            pointsSortedFromP1Reversed.length
        )
        .sort((a, b) => a.x - b.x)
        .map((p) => p.x);
    const pointsSortedFromP1YReversed = pointsSortedFromP1Reversed
        .slice(
            pointsSortedFromP1Reversed.length -
                pointsSortedFromP1Reversed.length * maxPercentageFromCorner,
            pointsSortedFromP1Reversed.length
        )
        .sort((a, b) => a.y - b.y)
        .map((p) => p.y);

    const ref1P1 = new Point(
        median(pointsSortedFromP1X),
        median(pointsSortedFromP1Y)
    );
    const ref2P1 = new Point(
        median(pointsSortedFromP1XReversed),
        median(pointsSortedFromP1YReversed)
    );

    const u1P1 = new Point(
        (p1.x - ref1P1.x) / p1.distanceTo(ref1P1),
        (p1.y - ref1P1.y) / p1.distanceTo(ref1P1)
    );
    const u2P1 = new Point(
        (p1.x - ref2P1.x) / p1.distanceTo(ref2P1),
        (p1.y - ref2P1.y) / p1.distanceTo(ref2P1)
    );

    const pointsSortedFromP2 = points
        .sort((a, b) => {
            const o = orientation(p2, a, b);
            if (o === 0) return p2.distanceTo(b) >= p2.distanceTo(a) ? -1 : 1;
            return o === 2 ? -1 : 1;
        })
        .filter((p) => p != p2);
    const pointsSortedFromP2Reversed = pointsSortedFromP2.reverse();

    const pointsSortedFromP2X = pointsSortedFromP2
        .slice(0, pointsSortedFromP2.length * maxPercentageFromCorner)
        .sort((a, b) => a.x - b.x)
        .map((p) => p.x);
    const pointsSortedFromP2Y = pointsSortedFromP2
        .slice(0, pointsSortedFromP2.length * maxPercentageFromCorner)
        .sort((a, b) => a.y - b.y)
        .map((p) => p.y);
    const pointsSortedFromP2XReversed = pointsSortedFromP2Reversed
        .slice(
            pointsSortedFromP2Reversed.length -
                pointsSortedFromP2Reversed.length * maxPercentageFromCorner,
            pointsSortedFromP2Reversed.length
        )
        .sort((a, b) => a.x - b.x)
        .map((p) => p.x);
    const pointsSortedFromP2YReversed = pointsSortedFromP2Reversed
        .slice(
            pointsSortedFromP2Reversed.length -
                pointsSortedFromP2Reversed.length * maxPercentageFromCorner,
            pointsSortedFromP2Reversed.length
        )
        .sort((a, b) => a.y - b.y)
        .map((p) => p.y);

    const ref1P2 = new Point(
        median(pointsSortedFromP2X),
        median(pointsSortedFromP2Y)
    );
    const ref2P2 = new Point(
        median(pointsSortedFromP2XReversed),
        median(pointsSortedFromP2YReversed)
    );

    const u1P2 = new Point(
        (p2.x - ref1P2.x) / p2.distanceTo(ref1P2),
        (p2.y - ref1P2.y) / p2.distanceTo(ref1P2)
    );
    const u2P2 = new Point(
        (p2.x - ref2P2.x) / p2.distanceTo(ref2P2),
        (p2.y - ref2P2.y) / p2.distanceTo(ref2P2)
    );

    const lines: Line[] = [
        new Line(
            new Point(p1.x + 1000000 * u1P1.x, p1.y + 1000000 * u1P1.y),
            new Point(p1.x - 1000000 * u1P1.x, p1.y - 1000000 * u1P1.y)
        ),
        new Line(
            new Point(p1.x + 1000000 * u2P1.x, p1.y + 1000000 * u2P1.y),
            new Point(p1.x - 1000000 * u2P1.x, p1.y - 1000000 * u2P1.y)
        ),
        new Line(
            new Point(p2.x + 1000000 * u1P2.x, p2.y + 1000000 * u1P2.y),
            new Point(p2.x - 1000000 * u1P2.x, p2.y - 1000000 * u1P2.y)
        ),
        new Line(
            new Point(p2.x + 1000000 * u2P2.x, p2.y + 1000000 * u2P2.y),
            new Point(p2.x - 1000000 * u2P2.x, p2.y - 1000000 * u2P2.y)
        ),
    ];

    const intersections: Point[] = [];
    for (let i = 0; i < lines.length; i++) {
        const lineA = lines[i];
        for (let j = i + 1; j < lines.length; j++) {
            const lineB = lines[j];
            const intersection = checkIntersection(
                lineA.a.x,
                lineA.a.y,
                lineA.b.x,
                lineA.b.y,
                lineB.a.x,
                lineB.a.y,
                lineB.b.x,
                lineB.b.y
            );
            if (
                intersection.type == "intersecting" &&
                intersection.point.x > 0 &&
                intersection.point.y > 0 &&
                intersection.point.x < width &&
                intersection.point.y < height
            ) {
                intersections.push(
                    new Point(intersection.point.x, intersection.point.y)
                );
            }
        }
    }

    // const corners: Point[] = [];
    // for (let i = 0; i < intersections.length; i++) {
    //     const intersection = intersections[i];
    //     let closestPoint = points[0];
    //     let dist = closestPoint.distanceTo(intersection);
    //     for (let j = 1; j < points.length; j++) {

    //     }
    // }
    return intersections;
}
