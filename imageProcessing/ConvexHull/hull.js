class Point {
	/**
	 * Creates a point.
	 * @param {number} x - The upper left x-coord
	 * @param {number} y - The upper left y-coord
	 */
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Calculates the distance from `this` point to the requested `Point`
	 * @param {Point} point
	 */
	distanceTo(point) {
		return Math.sqrt(
			Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
		);
	}

	get length() {
		return Math.sqrt(
			Math.pow(this.b.x - this.a.x, 2) + Math.pow(this.b.y - this.a.y, 2)
		);
	}
}

//using some random as example
var p0 = new Point(5,1);
var p1 = new Point(1,3);
var p2 = new Point(4,2);
var p3 = new Point(11,10);
var p4 = new Point(7,4);
var p5 = new Point(4,5);
var p6 = new Point(5,8);
var p7 = new Point(1,7);
var p8 = new Point(9,7);
var p9 = new Point(3,4);

var list = []
list.push(p0,p1,p2,p3,p4,p5,p6,p7,p8,p9);
console.log(convexHull(list))


function convexHull(Points) {
	//find point with smallets y-coordinate
	minIndex = findSmallestY(Points);
	//Swap
	var swappedPoints = swap(Points, 0, minIndex);
	//remove the first element, which is used as reference in the algorithm
	p0 = swappedPoints.shift();
	//sort the Points based on their Polar angle with p0
	var sortedPoints = swappedPoints.sort(compare);
	//Remove points with the same polar Angle, only the point located
	//farthest from p0 remains int the list
	var filtered = filterOnAngle(sortedPoints);
	//if the filtered array contains less then 3 points, there is no convex hull
	if (filtered.length < 3) return;
	//create a stack and push first three points to it
	var stack = [];
	stack.push(p0,filtered[0], filtered[1]);
	for (var i = 2; i < filtered.length; i++){
      // Keep removing top while the angle formed by
      // points next-to-top, top, and points[i] makes
      // a non-left turn
      while (orientation(stack[stack.length-2], stack[stack.length-1], filtered[i]) != 2) {
		stack.splice(stack.length-1,1);
	  }
      stack.push(filtered[i]);
	}
	return stack;


}

function findSmallestY(Points) {
	var minimumY = Number.POSITIVE_INFINITY;
	var minIndex = 0;
	for(var i = 0; i < Points.length; i++) {
		if (Points[i].y < minimumY) {
			minimumY = Points[i].y
			minIndex = i;
		}
		if (Points[i].y == minimumY) {
			if (Points[i].x < Points[minIndex].x) {
				minIndex = i;
			}			
			
		}
	}
	return minIndex;
}

function orientation(p, q, r) {
    var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val == 0) {
		return 0;
	}  // colinear
    if (val > 0) {
		return 1;
	} else {
		return 2;
	} // clock or counterclock wise
}


function compare(p1, p2) {
   // Find orientation
   var o = orientation(p0, p1, p2);
   if (o == 0) 
     return (p0.distanceTo(p2) >= p0.distanceTo(p1))? -1 : 1;
   return (o == 2)? -1: 1;
}

function swap(Points, i, j) {
	var temp = Points[i];
    Points[i] = Points[j];
	Points[j] = temp;
	return Points;
}

function filterOnAngle(Points) {
	var toRemove = [];
	var currentIndex;
	for (var i = 0; i < Points.length - 1; i++) {
		if (orientation(p0, Points[i], Points[i+1]) == 0){
			toRemove.push(i);
		}
	}
	while(toRemove.length) {
		Points.splice(toRemove.pop(), 1);
	}
	return Points;
}
