import MiddlePoint from "../image_processing/Triangulation/MiddlePoint";
import Point from "../image_processing/screen_detection/Point";

export default class Animation {
    private _socket: SocketIOClient.Socket;
    middlePoints: MiddlePoint[];
    nextMiddlePoint: MiddlePoint;
    animating: boolean;
    timeToNextLine: number;

    constructor(socket: SocketIOClient.Socket) {
        this.middlePoints = [];
        this.nextMiddlePoint = this.middlePoints[0];
        this.animating = false;
        this._socket = socket;
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
        linkedLine.forEach(element => {
            const point = element.point[0];
            const endPoint = element.point[1];
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
        });
        this.nextMiddlePoint = this.middlePoints.find(Element => {
            next.linkedMiddlePoint == Element.middlePoint;
        });
        return 0;
    }

    travelTime(endpoint: Point) {}

    nextLineSetup(newTimeToNextLine: number) {
        setTimeout(() => {
            this.timeToNextLine = newTimeToNextLine;
        }, this.timeToNextLine);
    }

    stop() {
        this.animating = false;
    }
}
