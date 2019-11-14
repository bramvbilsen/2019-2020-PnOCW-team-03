import Point from "../image_processing/screen_detection/Point";

export function getCentroidOf(points: Point[]): Point {
    var sumX = 0;
    var sumY = 0;
    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
    });
    return new Point(
        Math.round(sumX / points.length),
        Math.round(sumY / points.length)
    );
}
