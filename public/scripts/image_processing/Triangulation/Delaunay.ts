import Point from "../screen_detection/Point";
import Line from "../screen_detection/Line";
import Triangulation from "./Triangulation";
import Circle from "./Circle";
var gauss = require("gaussian-elimination");

function delauney(points: Point[]): Triangulation {
    //basisgevallen, geven triangulaties terug
    if (points.length == 3) {
          let line1 = new Line(points[0],points[1]);
      let line2 = new Line(points[0],points[2]);
      let line3 = new Line(points[2],points[1]);
      let trian: Triangulation = new Triangulation([line1,line2,line3]);
      return trian;
      }
    if (points.length == 2) {
      let line1 = new Line(points[0],points[1]);
      let trian: Triangulation = new Triangulation([line1]);
      return trian;
    }
    if (points.length == 1) {
      let line1 = new Line(points[0],points[0]);
      let trian: Triangulation = new Triangulation([line1]);
      return trian;
  
    }
    if (points.length == 0) {
      return new Triangulation([]);
    }
  
    let new_width = Math.ceil(points.length/2);
    var left = points.slice(0,new_width);
    var right = points.slice(new_width,points.length);
    return delauneyMerging(delauney(left),delauney(right));
  }

function delauneyMerging(left: Triangulation, right: Triangulation) {
  console.log('---------------');
  console.log(left.lines);
  console.log(right.lines);
  if (left.lines.length == 0 || right.lines.length == 0) {
    let merge = new Triangulation(left.lines.concat(right.lines));
    return merge;
  }
  let lr = [];
  let base = findbase(left,right);
  lr.push(base);
  let merged = false;

  while (!merged) {
    console.log('=================');
    console.log(base);

    //console.log(base);
    let leftPotential = potential(left,base,0);
    let rightPotential = potential(right,base,1);
    console.log(leftPotential);
    console.log(rightPotential);

    if (leftPotential == null && !(rightPotential == null)) {
      lr.push(new Line(base.endPoints[0],rightPotential));
    }
    else if (rightPotential == null && !(leftPotential == null)) {
      lr.push(new Line(leftPotential,base.endPoints[1]));
    }
    else if (!(rightPotential == null) && !(leftPotential == null)) {
      lr.push(decide(rightPotential,leftPotential,base));
    }
    else {
      merged = true;
    }
    base = lr[lr.length - 1]; //de nieuwe base en de redenering blijven verder doen

  }

  let merge = new Triangulation(left.lines.concat(right.lines.concat(lr)));
  return merge;
}

function findbase(left: Triangulation, right: Triangulation) { 
    let pointsLeft = left.points;
    let pointsRight = right.points;
    pointsLeft.sort(function(a, b){
      if (a.y-b.y == 0) {
        return a.x+b.x
      }
      else {
        return a.y-b.y
      }
    });
    pointsRight.sort(function(a, b){
      if (a.y-b.y == 0) {
        return a.x-b.x
      }
      else {
        return a.y-b.y
      }
    });
    let base = new Line(pointsLeft[0], pointsRight[0]);
    let ind;
    if (pointsLeft[0].y < pointsRight[0].y) {
      ind = base.endPoints.indexOf(pointsLeft[0]);
    }
    else {ind = base.endPoints.indexOf(pointsLeft[1]);}
    let goodBase = false;
    let j = 0;
    while (!goodBase) {
      goodBase = true;
      if (ind == 0) {
        for (let i = 1; i < pointsLeft.length; i++) {
          j+=1;
          let line = new Line(pointsLeft[i],pointsRight[0])
          if (!base.lineAbove(line,1)){
            base = new Line(pointsLeft[i], pointsRight[0]);
            goodBase = false;
            pointsLeft.splice(0,j);
            break;
          }
        }
      }
      else {
        for (let i = 1; i < pointsRight.length; i++) {
          j+=1;
          let line = new Line(pointsLeft[0],pointsRight[i])
          if (!base.lineAbove(line,0)){
            base = new Line(pointsLeft[0], pointsRight[i]);
            goodBase = false;
            pointsRight.splice(0,j);
            break;
          }
        }
      }
    }
    return base;
}

function potential(triang: Triangulation,base: Line, index: number) {
    console.log('!!!!!');
    console.log(triang.lines);
    let lines = triang.linesWithCertainPoints(base.endPoints[index]);
    console.log(lines);
    //console.log(triang.lines);
    //console.log(base.endPoints[index]);
    //console.log(lines);
    lines = lines.filter(function(value) {
      return base.lineAbove(value,index);
    });
    lines.sort(function(a,b) {
      return base.angle(a,index) - base.angle(b,index); //efficienter om met dictionaries te werken wss
    });
    console.log(lines);
    //console.log(lines);
    for (let i = 0; i < lines.length; i++) {
      console.log(lines[i]);
      let points = lines[i].endPoints;
      let line3;
      let potenPoint;
      if (points[0] == base.endPoints[index]) {
        line3 = new Line(points[1],base.endPoints[(index + 1)%2]);
        potenPoint = points[1];
      }
      else {
        line3 = new Line(points[0],base.endPoints[(index + 1)%2]);
        potenPoint = points[0];
      }
  
      if (i == lines.length - 1) {
        if (base.angle(lines[i],index) < 180) {
          return potenPoint;
        }
        else {
          console.log('YYYYYYYYYYY');
          console.log(base.angle(lines[i],index));
          console.log(potenPoint);
          triang.remove(lines[i]);
          return null;
        }
      }
      else if (base.angle(lines[i],index) < 180 && !lines[i].surroundingCircle(base,line3).liesInCircle(lines[i+1],base.endPoints[index])) { //efficienter!
        console.log(lines[i].surroundingCircle(base,line3));
        console.log(lines[i+1]);
        return potenPoint;
      }
      else {
        console.log('hhhhh');
        console.log('YYYYYYYYYYY');
        console.log(lines[i].surroundingCircle(base,line3));
        console.log(potenPoint);
        triang.remove(lines[i]);
      }
    }
    return null;
}

function decide(right: Point, left:Point ,base:Line) {
    let line1 = new Line(left,base.endPoints[0]);
    let line2 = new Line(left,base.endPoints[1]);
    if (!line1.surroundingCircle(base,line2).liesInCirclep(right)) {
        return new Line(left,base.endPoints[1]);
    }
    else {
      return new Line(base.endPoints[0],right);
    }
  }

var a = new Point(0,1);  
var b = new Point(1,0);  
var c = new Point(2,1);  
var d = new Point(1,2);  
var e = new Point(1,3);  
var f = new Point(3,3);  
var g = new Point(4,2);  
var h = new Point(5,3);  
var i = new Point(5,1);  
var j = new Point(5,0);  

var tr = delauney([a,b,c,d,e,f,g,h,i,j]);
console.log(tr.lines);
console.log(tr.lines.length);