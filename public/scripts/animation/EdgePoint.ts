import Point from "../image_processing/screen_detection/Point";

export default class EdgePoint {
    point: Point;
    connectedEdges: Array<EdgePoint>;

    constructor(point: Point, edges: Array<EdgePoint> = []) {
        this.point = point;
        this.connectedEdges = edges;
    }

    distanceTo(edge: EdgePoint) {
        return Math.sqrt(Math.pow(edge.point.x - this.point.x, 2) + Math.pow(edge.point.y - this.point.y, 2));
    }

    toString() {
        return "x: " + this.point.x + ", y: " + this.point.y;
    }

    copy() {
        return new EdgePoint(this.point, this.connectedEdges);
    } 

    equals(edge: EdgePoint) {
        if (! this.point.equals(edge.point)) return false;
        //TODO connectedEdges
        return true;
    }

    x() {
        return this.point.x;
    }

    y() {
        return this.point.y;
    }

    addConnectedEdge(edge: EdgePoint) {
        this.connectedEdges.push(edge);
    }

    removeConnectedEdge(edge: EdgePoint) {
        for( let i = 0; i < this.connectedEdges.length; i++){ 
            if (this.connectedEdges[i] === edge) {
                this.connectedEdges.splice(i, 1);
                i--;
            }
         }
         
    }
}