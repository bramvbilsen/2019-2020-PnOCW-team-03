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

export function calculateBoundingBox(
    points: Point[]
): { topLeft: Point; topRight: Point; bottomLeft: Point; bottomRight: Point } {
    const xCoordinates = points.map(point => point.x).sort((a, b) => a - b);
    const yCoordinates = points.map(point => point.y).sort((a, b) => a - b);
    const minX = xCoordinates[0];
    const maxX = xCoordinates[xCoordinates.length - 1];
    const minY = yCoordinates[0];
    const maxY = yCoordinates[yCoordinates.length - 1];
    return {
        topLeft: new Point(minX, minY),
        bottomRight: new Point(maxX, maxY),
        topRight: new Point(maxX, minY),
        bottomLeft: new Point(minX, maxY),
    };
}
