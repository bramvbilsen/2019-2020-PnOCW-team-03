//console.log(cornerLabeling([1,3],[3,1.5],[3,3],[1,1]));
//console.log(cornerLabeling([43,85],[59,60],[60,80],[40,60]));
console.log(getAngle([1,3],[3,1.5],[3,3],[1,1]));
console.log(getAngle([43,85],[59,60],[60,80],[40,60]));

function cornerLabeling(p1, p2, p3, p4) {
	var corners = [p1, p2, p3, p4]
	var sums = []
	var min = Number.POSITIVE_INFINITY;
	var max = Number.NEGATIVE_INFINITY;
	var rightUnderIndex, leftUpperIndex;
	var rightUpperCoordinate, leftUnderCoordinate, leftUpperCoordinate, rightUnderCoordinate;
	
	
	sums[0] = p1[0] + p1[1];
	sums[1] = p2[0] + p2[1];
	sums[2] = p3[0] + p3[1];
	sums[3] = p4[0] + p4[1];
	for (var i = 0; i < sums.length; i++) {
		if (sums[i] >= max) {
			max = sums[i]
			rightUnderIndex = i;
			rightUnderCoordinate = corners[i]
		}
		if (sums[i] <= min) {
			min = sums[i]
			leftUpperIndex = i;
			leftUpperCoordinate = corners[i]
		}
		
	}
	corners.splice(rightUnderIndex, 1);
	corners.splice(leftUpperIndex, 1);
	
    if(corners[0][0] - corners[1][0] >= 0 && corners[0][1] - corners[1][1] <= 0) {
		rightUpperCoordinate = corners[0];
		leftUnderCoordinate = corners[1];
		rightUpperIndex = 0;
		leftUnderIndex = 1;
	} else {
		rightUpperCoordinate = corners[1];
		leftUnderCoordinate = corners[0];
		rightUpperIndex = 1;
		leftUnderIndex = 0;
	}
	return[leftUpperCoordinate,rightUpperCoordinate,rightUnderCoordinate,leftUnderCoordinate]
	
}

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
