import Point from "../image_processing/screen_detection/Point";
import EdgePoint from "./EdgePoint";

export default class Entity {
    id: String;
    point: Point;
    target: Point;
    speed: number;

    constructor(id: String, point: Point, target: Point = undefined, speed: number = 1) {
        this.id = id;
        this.point = point;
        this.speed = speed;
    }

    distanceTo(entity: Entity) {
        return this.point.distanceTo(entity.point);
    }

    toString() {
        return JSON.stringify({ id: this.id, x: this.x(), y: this.y() });
    }

    copy() {
        return new Entity(this.id, this.point, this.target, this.speed);
    } 

    equals(entity: Entity) {
        if (this.id != entity.id) return false;
        if (! this.point.equals(entity.point)) return false;

        return true;
    }

    x() {
        return this.point.x;
    }

    y() {
        return this.point.y;
    }

    hasTarget() {
        return this.target != undefined;
    }

    move(deltaTime: number) {
        if (! this.hasTarget()) return;

        let distance: number = this.target.distanceTo(this.point);
        let xDirection: number = (this.target.x - this.point.x) / distance;
        let yDirection: number = (this.target.y - this.point.y) / distance;

        let movement: number = this.speed * deltaTime;
        if (movement > distance) {
            this.point = this.target.copy();
            this.target = undefined;
        } else {
            this.point.x += xDirection * movement;
            this.point.y += yDirection * movement;
        }
           
    }

}