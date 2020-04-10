import MiddlePoint from "../image_processing/Triangulation/MiddlePoint";
import Point from "../image_processing/screen_detection/Point";
import Client from "./Client";

export default class Animation {
    client: Client;
    middlePoints: MiddlePoint[];
    nextMiddlePoint: MiddlePoint;
    animating: boolean;
    timeToNextLine: number;

    constructor(client: Client) {
        this.middlePoints = [];
        this.nextMiddlePoint = this.middlePoints[0];
        this.animating = false;
        this.client = client;
    }

    animate() {
        this.animating = true;
        this.animateLoop();
    }

    animateLoop() {
        let delay = 10000;
        this.timeToNextLine = Date.now() + delay;
        this.timeToNextLine = this.sendLine();
        while (this.animating) {
            this.nextLineSetup(this.sendLine());
        }
    }

    sendLine() {
        const next = this.nextMiddlePoint.next();
        const linkedLine = next.linkedLine;
        const currentMidlePoint = this.nextMiddlePoint.middlePoint;
        linkedLine.forEach((element) => {
            const point = element.point[0];
            const slaveId = element.slaveId;
            const vector = {
                x: point.x - currentMidlePoint.x,
                y: point.y - currentMidlePoint.y,
            };
            const distance = Math.sqrt(
                Math.pow(vector.x, 2) + Math.pow(vector.y, 2)
            );
            const unitVecor = {
                x: vector.x / distance,
                y: vector.y / distance,
            };
            this.client.sendAnimation(
                unitVecor,
                point,
                this.timeToNextLine + distance / 20,
                slaveId
            );
        });
        this.nextMiddlePoint = this.middlePoints.find((Element) => {
            next.linkedMiddlePoint == Element.middlePoint;
        });
        return (
            Math.sqrt(
                Math.pow(
                    this.nextMiddlePoint.middlePoint.x - currentMidlePoint.x,
                    2
                ) +
                    Math.pow(
                        this.nextMiddlePoint.middlePoint.y -
                            currentMidlePoint.y,
                        2
                    )
            ) / 20
        );
    }

    nextLineSetup(newTimeToNextLine: number) {
        const eta_ms = this.timeToNextLine - Date.now();
        setTimeout(() => {
            this.timeToNextLine = newTimeToNextLine;
        }, eta_ms);
    }

    stop() {
        this.animating = false;
    }
}
