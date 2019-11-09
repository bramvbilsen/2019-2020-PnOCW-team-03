import Point from "./Point";
import Line from "./Line";

export default class Circle {
    m: Point;
    r: number;

    constructor(m: Point, r: number) {
      this.m = m;
      this.r = r;
    }
  
    get radius() {
      return this.r;
    }
  
    get middlePoint() {
      return this.m;
    }
  
    liesInCircle(points: Line, base: Point) {
      let point;
      if (points.endPoints[0] != base) {
        point = points.endPoints[0];
      }
      else {
        point = points.endPoints[1];
      }
      let distance1 = Math.abs(Math.sqrt(
          Math.pow(this.m.x - point.x, 2) + Math.pow(this.m.y - point.y, 2)
      ));
  
      if ( distance1 >  this.radius - Math.pow(10, -5)) {
        return false;
      }
      return true;
    }
  
    liesInCirclep(point: Point) {
      let distance = Math.abs(Math.sqrt(
          Math.pow(this.m.x - point.x, 2) + Math.pow(this.m.y - point.y, 2)
      ));
      if ( distance >  this.radius - Math.pow(10, -5)) {
        return false;
      }
      return true;
    }
  }