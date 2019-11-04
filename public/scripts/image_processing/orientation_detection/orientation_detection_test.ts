import Point from "../screen_detection/Point";
import {getAllCentroids, cornerLabeling, getAngle} from "./orientation_detection";

const POINTS = [new Point(341,283), new Point(650,280),new Point(646,498),new Point(350,506)];


function runAllTests() {
	labelingTest1(cornerLabeling, new Point(0,0), new Point(2,2), new Point(2,0), new Point(0,2));
	/*labelingTest2(cornerLabeling, [80,120], [120,80], [120, 120], [80,80]);
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
    */
}



/* 1) CENTROID-TESTS */
function getAllCentroidsTest() {
    console.log(getAllCentroids(POINTS)["0"].x == 420);
    console.log(getAllCentroids(POINTS)["0"].y == 338);
    
    console.log(getAllCentroids(POINTS)["1"].x == 573);
    console.log(getAllCentroids(POINTS)["1"].y == 336);
    
    console.log(getAllCentroids(POINTS)["2"].x == 572);
    console.log(getAllCentroids(POINTS)["2"].y == 445);
    
    console.log(getAllCentroids(POINTS)["3"].x == 423);
    console.log(getAllCentroids(POINTS)["3"].y == 449);
}

/* 2) LABELING-TESTS */
function labelingTest1(fct: (p1: Point, p2: Point, p3: Point, p4: Point) => {[key: string]: Point}, p1: Point, p2: Point, p3: Point, p4: Point){
    var expectedResult = [p1, p3, p2, p4];
    var result = fct(p1, p2, p3, p4);
    var correct = (result[0] == expectedResult[0] && result[1] == expectedResult[1] && result[2] == expectedResult[2] && result[3] == expectedResult[3]);
    console.log(correct);
}

function labelingTest2(fct: (p1: Point, p2: Point, p3: Point, p4: Point) => {[key: string]: Point}, p1: Point, p2: Point, p3: Point, p4: Point){
    var expectedResult = [p4, p2, p3, p1];
    var result = fct(p1, p2, p3, p4);
    var correct = (result[0] == expectedResult[0] && result[1] == expectedResult[1] && result[2] == expectedResult[2] && result[3] == expectedResult[3]);
    console.log(correct);
}

function labelingTest3(fct: (p1: Point, p2: Point, p3: Point, p4: Point) => {[key: string]: Point}, p1: Point, p2: Point, p3: Point, p4: Point){
    var expectedResult = [p2, p3, p4, p1];
    var result = fct(p1, p2, p3, p4);
    var correct = (result[0] == expectedResult[0] && result[1] == expectedResult[1] && result[2] == expectedResult[2] && result[3] == expectedResult[3]);
    console.log(correct);
}

/* 3) ANGLE-TESTS */
function angleSpeedTest(fct: (p1: Point, p2: Point, p3: Point, p4: Point) => number, p1: Point, p2: Point, p3: Point, p4: Point) {
    var start = new Date();
    fct(p1, p2, p3, p4);
    var end = new Date();
    var time = +end - +start;
    console.log("The algorithm to calculate the Angle took ", time, "milliseconds")
}
