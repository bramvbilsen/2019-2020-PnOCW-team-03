import MiddlePoint from "../image_processing/Triangulation/MiddlePoint";
import Point from "../image_processing/screen_detection/Point";
import Client from "./Client";

export default class Animation {
    client: Client;
    middlePoints: MiddlePoint[];
    nextMiddlePoint: MiddlePoint;
    timeToNextLine: number;
    stopTime = Date.now();

    constructor(client: Client) {
        this.middlePoints = [];
        this.client = client;
    }

    animate() {
        this.nextMiddlePoint = this.middlePoints[0];
        this.animateLoop();
    }

    animateLoop() {
        let delay = 10000;
        this.timeToNextLine = new Date().getTime() + delay;
        this.timeToNextLine = this.timeToNextLine + this.sendLine();
        this.nextLineSetup(this.sendLine());
    }

    sendLine() {
        console.log("sendline");
        const next = this.nextMiddlePoint.next();
        const linkedLine = next.linkedLine;
        const currentMidlePoint = this.nextMiddlePoint.middlePoint;
        const nextMiddlePoint = next.linkedMiddlePoint;
        const rvec = new Point(
            nextMiddlePoint.x - currentMidlePoint.x,
            nextMiddlePoint.y - currentMidlePoint.y
        );
        const rdist = Math.sqrt(Math.pow(rvec.x, 2) + Math.pow(rvec.y, 2));
        const unitVector = {
            x: rvec.x / rdist,
            y: rvec.y / rdist,
        };
        console.log(unitVector);

        //DATA BERKENEN VERSTUREN NAAR SLAVES
        linkedLine.forEach((element) => {
            //beginpunt
            const point = element.point[0];
            const slaveId = element.slaveId;

            //vector + distance
            const vector = {
                x: point.x - currentMidlePoint.x,
                y: point.y - currentMidlePoint.y,
            };
            let distance =
                Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2)) - 50;
            console.log(distance / 60);
            console.log(
                "start= " +
                    new Date(this.timeToNextLine + (distance / 60) * 1000)
            );

            //actual beginpunt
            const beginVector = {
                x: unitVector.x * distance,
                y: unitVector.y * distance,
            };
            let beginPoint: Point;
            if (currentMidlePoint.equals(point)) {
                beginPoint = point;
                distance += 50;
            } else {
                beginPoint = new Point(
                    currentMidlePoint.x + beginVector.x,
                    currentMidlePoint.y + beginVector.y
                );
            }

            //endpoint
            const endPoint = element.point[1];
            const vectorEnd = {
                x: endPoint.x - currentMidlePoint.x,
                y: endPoint.y - currentMidlePoint.y,
            };
            const distanceEnd =
                Math.sqrt(Math.pow(vectorEnd.x, 2) + Math.pow(vectorEnd.y, 2)) +
                50;
            console.log(distanceEnd / 60);

            //animatie sturen
            this.client.sendAnimation(
                unitVector,
                beginPoint,
                this.timeToNextLine + (distance / 60) * 1000,
                this.timeToNextLine + (distanceEnd / 60) * 1000,
                slaveId
            );
        });

        //tijd voor totale tijd berekenen
        console.log("next middlepoint = " + next.linkedMiddlePoint);
        console.log(this.middlePoints);
        this.nextMiddlePoint = this.middlePoints.find((Element) => {
            return next.linkedMiddlePoint.equals(Element.middlePoint);
        });
        console.log(rdist);
        console.log(rdist / 60);
        return (rdist / 60) * 1000;
    }

    nextLineSetup(newTimeToNextLine: number) {
        const arrivelTime = Date.now();
        const eta_ms = this.timeToNextLine - Date.now();
        console.log("WACHTTIJD = " + eta_ms);
        setTimeout(() => {
            if (this.stopTime - arrivelTime <= 0) {
                this.timeToNextLine = this.timeToNextLine + newTimeToNextLine;
                this.nextLineSetup(this.sendLine());
            }
        }, eta_ms);
    }

    stop() {
        this.stopTime = Date.now();
    }
}
