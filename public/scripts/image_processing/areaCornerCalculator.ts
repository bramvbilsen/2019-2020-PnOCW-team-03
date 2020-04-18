import Point from "./screen_detection/Point";
import { Camera } from "../UI/Master/Camera";

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
    const points = camera.applySobelEdgeFilter(foundScreenImgData);

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

    const centerP1P2 = new Point(
        p2.x + (p1.x - p2.x) / 2,
        p2.y + (p1.y - p2.y) / 2
    );

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

    let p4: Point;
    maxDist = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = p.distanceSq(p3);
        if (dist > maxDist && !p.equals(p1) && !p.equals(p2) && !p.equals(p3)) {
            // if (
            //     Math.abs(
            //         Math.atan2(p.y - p1.y, p.x - p1.x) -
            //             Math.atan2(p2.y - p1.y, p2.x - p1.x)
            //     ) >
            //         (20 * Math.PI) / 180 &&
            //     Math.abs(
            //         Math.atan2(p.y - p2.y, p.x - p2.x) -
            //             Math.atan2(p1.y - p2.y, p1.x - p2.x)
            //     ) >
            //         (20 * Math.PI) / 180 &&
            //     Math.abs(
            //         Math.atan2(p.y - p3.y, p.x - p3.x) -
            //             Math.atan2(p1.y - p3.y, p1.x - p3.x)
            //     ) >
            //         (20 * Math.PI) / 180 &&
            //     Math.abs(
            //         Math.atan2(p.y - p3.y, p.x - p3.x) -
            //             Math.atan2(p2.y - p3.y, p2.x - p3.x)
            //     ) >
            //         (20 * Math.PI) / 180
            // ) {
            maxDist = dist;
            p4 = p;
            // }
        }
    }

    return [p1, p2, p3, p4];
}
