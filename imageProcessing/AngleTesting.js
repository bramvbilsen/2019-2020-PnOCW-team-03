
const {performance} = require('perf_hooks');
var results= [];
runAllTests();

function runAllTests() {
	labelingTest1(cornerLabeling, [0,0], [2,2], [2,0], [0,2]);
	labelingTest2(cornerLabeling, [80,120], [120,80], [120, 120], [80,80]);
	labelingTest3(cornerLabeling, [5,7], [7,2], [12,5], [10,9]);

	angleSpeedTest(getAngle, [0,0], [2,2], [2,0], [0,2]);
	angleSpeedTest(getAngle, [80,120], [120,80], [120, 120], [80,80]);
	angleSpeedTest(getAngle, [5,7], [7,2], [12,5], [10,9]);
	angleSpeedTest(getAngle, [1,1], [19,19], [1,20], [18,2]);
	angleSpeedTest(getAngle, [1,1.2], [19.06,19], [1.01,20], [18,1.9]);
	angleSpeedTest(getAngle, [1,0.8], [19.05,19], [1.02,20], [18,2.1]);
	angleSpeedTest(getAngle, [1,1.1], [19.04,19], [1.03,20], [18,2.1]);
	angleSpeedTest(getAngle, [1,1.2], [19.03,19], [1.04,20], [18,1.9]);
	angleSpeedTest(getAngle, [1,0.8], [19.02,19], [1.05,20], [18,2.12]);
	angleSpeedTest(getAngle, [1,1.15], [19.01,19], [1.06,20], [18,2.11]);
	angleSpeedTest(getAngle, [1,1.22], [19.1,19], [1.07,20], [18,1.91]);
	angleSpeedTest(getAngle, [1,0.85], [19.2,19], [1.08,20], [18,2.01]);
	angleSpeedTest(getAngle, [1,1.12], [19.3,19], [1.09,20], [18,2.02]);
}

/**
 * Start of tests:
 */

function labelingTest1(fct, p1, p2, p3, p4){
		var expectedResult = [p1, p3, p2, p4];
        var result = fct(p1, p2, p3, p4);
		var correct = (result[0] == expectedResult[0] && result[1] == expectedResult[1] && result[2] == expectedResult[2] && result[3] == expectedResult[3]);
		console.log("Testing if labeling works correct...", '\n',"Expected Result: ", expectedResult, '\n', "Result: ", result);
		if (correct) {
			console.log("Result is correct");
		} else {
			console.log("Result is incorrect");
		}
    }
	
function labelingTest2(fct, p1,  p2, p3, p4){
		var expectedResult = [p4, p2, p3, p1];
        var result = fct(p1, p2, p3, p4);
		var correct = (result[0] == expectedResult[0] && result[1] == expectedResult[1] && result[2] == expectedResult[2] && result[3] == expectedResult[3]);
		console.log("Testing if labeling works correct with left  upper corner that is not (0,0)...", '\n',"Expected Result: ", expectedResult, '\n', "Result: ", result);
		if (correct) {
			console.log("Result is correct");
		} else {
			console.log("Result is incorrect");
		}
    }

function labelingTest3(fct, p1,  p2, p3, p4){
		var expectedResult = [p2, p3, p4, p1];
        var result = fct(p1, p2, p3, p4);
		var correct = (result[0] == expectedResult[0] && result[1] == expectedResult[1] && result[2] == expectedResult[2] && result[3] == expectedResult[3]);
		console.log("Testing if labeling works correct with slightly rotated screen...", '\n',"Expected Result: ", expectedResult, '\n', "Result: ", result);
		if (correct) {
			console.log("Result is correct");
		} else {
			console.log("Result is incorrect");
		}
    }
	
function angleSpeedTest(fct, p1,  p2, p3, p4) {
		var start = performance.now();
        fct(p1, p2, p3, p4);
        var end = performance.now();
        var time = end - start;
        var result = time;
		console.log("The algorithm to calculate the Angle took ", result, "milliseconds")
}

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
	return[leftUpperCoordinate, rightUpperCoordinate, rightUnderCoordinate, leftUnderCoordinate]
	
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
