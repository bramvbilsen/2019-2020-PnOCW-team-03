import { client } from "../../index";
import findScreen from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";

enum WorkflowStep {
    START = "initialize",
    BLANCO_PIC = "black screens picture",
    SLAVE_CYCLE = "iterating through slaves",
}


/**
 * Retains workflow:
 *  Blanco -> Kleur -> zwart foto -> cycle slaves
 *  cycle slaves: show color -> next slave
 */
export default class SlaveFlowHandler {
    prevSlaveID: string;
    currSlaveID: string;
    slaveIDs: string[];
    step: WorkflowStep;
    blancoImg: string;
    screens: SlaveScreen[] = [];

    constructor() {
        this.step = WorkflowStep.START;
        this.slaveIDs = [...client.slaves];
        this.currSlaveID = this.slaveIDs.pop();
    }

    takeNoColorPicture() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const context = canvas[0].getContext('2d');
        context.drawImage(player[0], 0, 0, canvas[0].width, canvas[0].height);
        this.blancoImg = canvas[0].toDataURL();
    }

    /**
     * First we show the color on the slave.
     */
    showColorOnNextSlave() {
        const color = client.color;
        if (this.prevSlaveID) {
            client.color = { r: 255, g: 255, b: 255, a: 255 };
            client.showColorOnSlave(this.prevSlaveID);
        }
        client.color = color;
        client.showColorOnSlave(this.currSlaveID);
    }

    /**
     * Should be called after `showColorOnNextSlave`.
     */
    async takePictureOfColoredScreen() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const context = canvas[0].getContext('2d');
        context.drawImage(player[0], 0, 0, canvas[0].width, canvas[0].height);
        const coloredImg = canvas[0].toDataURL();
        const corners = await findScreen(this.blancoImg, coloredImg, client.color);
        this.screens.push(new SlaveScreen(corners, this.currSlaveID));
        this.prevSlaveID = this.currSlaveID;
        this.currSlaveID = this.slaveIDs.pop();
        context.fillStyle = "rgb(0, 255, 255)";
        corners.forEach(corner => {
            context.beginPath();
            context.arc(corner.x, corner.y, 20, 0, Math.PI * 2);
            context.fill();
            context.closePath();
        });
    }
}