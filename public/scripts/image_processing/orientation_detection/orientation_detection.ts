import Point from "../screen_detection/Point";

/**
 * 1) Get screen_centroid
 * 2) Get 4 centroid
 * 3) Get color for each centroid
 * 
 * @param points List of points representing the 4 corner-points to get the centroid for.
 */
function main(points: Point[]): void {
    const centroids = getAllCentroids(points);
    // 1) check for range of 20 px TODO: finetunen van aantal pixels

    // 2) 

}

/**
 * VANAF 45°
 */
function cornerLabeling(p1: Point, p2: Point, p3: Point, p4: Point) {
    var corners = [p1, p2, p3, p4]
    var sums = []
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    var rightUnderIndex, leftUpperIndex;
    var rightUpperCoordinate: Point, leftUnderCoordinate: Point, leftUpperCoordinate: Point, rightUnderCoordinate: Point;

    sums[0] = p1.x + p1.y;
    sums[1] = p2.x + p2.y;
    sums[2] = p3.x + p3.y;
    sums[3] = p4.x + p4.y;

    /* 1) LEFT-UPPER & RIGHT-UNDER */
    for (var i = 0; i < sums.length; i++) {
        if (sums[i] >= max) {
            max = sums[i];
            rightUnderIndex = i;
            rightUnderCoordinate = corners[i];
        }
        if (sums[i] <= min) {
            min = sums[i];
            leftUpperIndex = i;
            leftUpperCoordinate = corners[i];
        }

    }
    // Remove those two
    corners.splice(rightUnderIndex, 1);
    corners.splice(leftUpperIndex, 1);

    /* 2) REST */
    if (corners[0].x - corners[1].x >= 0 && corners[0].y - corners[1].y <= 0) {
        rightUpperCoordinate = corners[0];
        leftUnderCoordinate = corners[1];
    } else {
        rightUpperCoordinate = corners[1];
        leftUnderCoordinate = corners[0];
    }

    return { "LeftUp": leftUpperCoordinate, "RightUp": rightUpperCoordinate, "RightUnder": rightUnderCoordinate, "LeftUnder": leftUnderCoordinate };
}

/*
function getAngle(p1, p2, p3, p4) {
	var labeledCorners = cornerLabeling(p1, p2, p3, p4);
	var left = labeledCorners[0];
	var right = labeledCorners[1];
	var origin = left;
	var vector1 = [right[0]-origin[0],left[1]-origin[1]];
	var vector2 = [right[0]-origin[0], right[1]-origin[1]];
	var radians = Math.atan2(vector2[1], vector2[0]) - Math.atan2(vector1[1], vector1[0]);
	return radians * (180/Math.PI);
}
*/



function getAllCentroids(points: Point[]): {[key: string]: Point} {
    /**
     * Get the centroid (center point) of the 4 given corner points.
     * 
     * @param points List of points representing the 4 corner-points to get the centroid for.
     */
    function getCentroidOf(points: Point[]): Point {
        var sumX = 0;
        var sumY = 0;
        points.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        });
        return new Point(sumX / points.length, sumY / points.length);
    }

    const labeledCorners = cornerLabeling(points[0], points[1], points[2], points[3]);
    const leftUpper = labeledCorners["LeftUp"];
    const rightUpper = labeledCorners["RightUp"];
    const leftUnder = labeledCorners["LeftUnder"];
    const rightUnder = labeledCorners["RightUnder"];
    const upperMiddle = new Point((rightUpper.x + leftUpper.x) / 2, (rightUpper.y + leftUpper.y) / 2);
    const lowerMiddle = new Point((rightUnder.x + leftUnder.x) / 2, (rightUnder.y + leftUnder.y) / 2);
    const leftMiddle = new Point((leftUpper.x + leftUnder.x) / 2, (leftUpper.y + leftUnder.y) / 2);
    const rightMiddle = new Point((rightUnder.x + rightUpper.x) / 2, (rightUnder.y + rightUpper.y) / 2);

    const centroid = getCentroidOf(points);
    const centroid1 = getCentroidOf([leftUpper, upperMiddle, leftMiddle, centroid]);
    const centroid2 = getCentroidOf([upperMiddle, rightUpper, centroid, rightMiddle]);
    const centroid3 = getCentroidOf([leftMiddle, centroid, leftUnder, lowerMiddle]);
    const centroid4 = getCentroidOf([centroid, rightMiddle, lowerMiddle, rightUnder]);

    return {"centroid": centroid, "centroid1": centroid1, "centroid2": centroid2, "centroid3": centroid3, "centroid4": centroid4};
}

/* TEST */
// let test: Point = getCentroidOf([new Point(0, 0), new Point(10, 0), new Point(0, 10), new Point(10, 10)]);
// console.log("(" + test.x + "," + test.y + ")");
