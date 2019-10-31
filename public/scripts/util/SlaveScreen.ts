import Point from "../image_processing/screen_detection/Point";

export default class SlaveScreen {
    corners: Point[];
    slaveID: string;

    constructor(corners: Point[], slaveID: string) {
        this.corners = corners;
        this.slaveID = slaveID;
    }
}