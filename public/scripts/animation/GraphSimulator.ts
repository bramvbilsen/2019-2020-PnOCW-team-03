import Entity from "./Entity";
import EdgePoint from "./EdgePoint";
import Line from "../image_processing/screen_detection/Line";
import Point from "../image_processing/screen_detection/Point";

export default class GraphSimulator {
    graphLines: Array<Line>;
    entities: Array<Entity>;
    lastUpdate: number;

    constructor(graphLines: Array<Line> = [], entities: Array<Entity> = []) {
        this.graphLines = graphLines;
        this.entities = entities;

        this.resetLastUpdate();
    }

    getDeltaTime() {
        let now: number = Date.now();
        let deltaTime: number = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        return deltaTime;
    }

    resetLastUpdate() {
        this.lastUpdate = Date.now();
    }

    update() {
        let deltaTime: number = this.getDeltaTime();

        this.entities.forEach(entity => {
            entity.move(deltaTime);
            entity.hasTarget || (entity.target = this.findNewTarget(entity.point));
        });
    }

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    findNewTarget(start: Point) {
        let targets: Array<Point> = [];

        this.graphLines.forEach(line => {
            if (line.endPoints[0].equals(start)) targets.push(line.endPoints[1]);
            if (line.endPoints[1].equals(start)) targets.push(line.endPoints[0]);
        });

        return targets[Math.floor(Math.random() * (targets.length + 1))];
    }

}