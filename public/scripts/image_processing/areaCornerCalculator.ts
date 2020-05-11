import Point from "./screen_detection/Point";
import { Camera } from "../UI/Master/Camera";
import { filterOnAngle, orientation } from "./screen_detection/hull";

export function findAreaCorners(
    area: Point[],
    camera: Camera,
    width: number,
    height: number
) {
    const foundScreenImgData = new ImageData(width, height);
    const foundScreenPixels = foundScreenImgData.data;

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

    const centerP1P2 = new Point(
        p2.x + (p1.x - p2.x) / 2,
        p2.y + (p1.y - p2.y) / 2
    );

    // points = points.sort((a, b) => {
    //     const o = orientation(p1, a, b);
    //     if (o === 0) return p1.distanceTo(b) >= p1.distanceTo(a) ? -1 : 1;
    //     return o === 2 ? -1 : 1;
    // });

    // const distP1CenterP1P2 = p1.distanceTo(centerP1P2);

    // let p3: Point;
    // let prevDistToP1P2: number;
    // for (let i = 0; i < points.length; i++) {
    //     const p = points[i];
    //     let dist = centerP1P2.distanceTo(p);
    //     if (dist < distP1CenterP1P2 * 0.1) {
    //         continue;
    //     }
    //     let t =
    //         ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) /
    //         dist;
    //     t = Math.max(0, Math.min(1, t));
    //     const distToP1P2 = Math.sqrt(
    //         p.distanceTo(
    //             new Point(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y))
    //         )
    //     );
    //     console.log(distToP1P2);
    //     if (
    //         // prevDistToP1P2 &&
    //         // prevDistToP1P2 > distToP1P2 * 0.5 &&
    //         // prevDistToP1P2 < distP1CenterP1P2 * 1.5
    //         distToP1P2 > 10
    //     ) {
    //         p3 = p;
    //         break;
    //     }
    //     prevDistToP1P2 = distP1CenterP1P2;
    // }

    // let p4: Point;
    // prevDistToP1P2 = null;
    // for (let i = points.length - 1; i > 0; i--) {
    //     const p = points[i];
    //     let dist = centerP1P2.distanceTo(p);
    //     if (dist < distP1CenterP1P2 * 0.1) {
    //         continue;
    //     }
    //     let t =
    //         ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) /
    //         dist;
    //     t = Math.max(0, Math.min(1, t));
    //     const distToP1P2 = Math.sqrt(
    //         p.distanceTo(
    //             new Point(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y))
    //         )
    //     );
    //     if (
    //         prevDistToP1P2 &&
    //         prevDistToP1P2 > distToP1P2 * 0.5 &&
    //         prevDistToP1P2 < distP1CenterP1P2 * 1.5
    //     ) {
    //         p4 = p;
    //         break;
    //     }
    //     prevDistToP1P2 = distP1CenterP1P2;
    // }

    let p3: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = p.distanceSq(centerP1P2);
        if (dist > maxDist && !p.equals(p1) && !p.equals(p2)) {
            if (
                Math.abs(
                    Math.atan2(p.y - p1.y, p.x - p1.x) -
                        Math.atan2(p2.y - p1.y, p2.x - p1.x)
                ) >
                    (20 * Math.PI) / 180 &&
                Math.abs(
                    Math.atan2(p.y - p2.y, p.x - p2.x) -
                        Math.atan2(p1.y - p2.y, p1.x - p2.x)
                ) >
                    (20 * Math.PI) / 180
            ) {
                maxDist = dist;
                p3 = p;
            }
        }
    }

    if (!p3) {
        return [p1, p2];
    }

    let p4: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = p.distanceSq(p3);
        if (dist > maxDist && !p.equals(p1) && !p.equals(p2) && !p.equals(p3)) {
            maxDist = dist;
            p4 = p;
        }
    }

    if (!p4) {
        return [p1, p2, p3];
    }

    return [p1, p2, p3, p4];
}
