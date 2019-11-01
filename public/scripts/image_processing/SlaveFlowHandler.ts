import { client } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import env from "../../env/env";
import { calculateCameraCanvasScaleFactor } from "./camera_util";

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
    blancoCanvas: HTMLCanvasElement;
    screens: SlaveScreen[] = [];

    constructor() {
        this.step = WorkflowStep.START;
    }

    private initialize() {
        this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        this.currSlaveID = this.slaveIDs.pop();
    }

    private toggleCaptureButton(mode: "ON" | "OFF") {
        const captureButton: JQuery<HTMLButtonElement> = $("#capture");
        const nextSlaveButton: JQuery<HTMLButtonElement> = $("#next-slave");
        captureButton.css("display", mode === "ON" ? "inherit" : "none");
        nextSlaveButton.css("display", mode === "ON" ? "none" : "inherit");
    }

    takeNoColorPicture() {
        this.initialize();
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const cameraWidth = player[0].videoWidth, cameraHeight = player[0].videoHeight;

        const scale = calculateCameraCanvasScaleFactor(cameraWidth, cameraHeight, canvas[0].width, canvas[0].height);

        const context = canvas[0].getContext('2d');
        context.drawImage(player[0], 0, 0, cameraWidth * scale, cameraHeight * scale);

        const blancoCanvas = createCanvas(canvas[0].width, canvas[0].height);
        blancoCanvas.getContext("2d").drawImage(player[0], 0, 0, cameraWidth * scale, cameraHeight * scale);
        this.blancoCanvas = blancoCanvas;
        this.toggleCaptureButton("OFF");
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
        const captureButton: JQuery<HTMLButtonElement> = $("#capture");
        captureButton.click(() => {
            this.takePictureOfColoredScreen();
        });
        this.toggleCaptureButton("ON");
    }

    /**
     * Should be called after `showColorOnNextSlave`.
     */
    async takePictureOfColoredScreen() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const cameraWidth = player[0].videoWidth, cameraHeight = player[0].videoHeight;
        const scale = calculateCameraCanvasScaleFactor(cameraWidth, cameraHeight, canvas[0].width, canvas[0].height);
        const coloredCanvas = createCanvas(canvas[0].width, canvas[0].height);
        coloredCanvas.getContext("2d").drawImage(player[0], 0, 0, cameraWidth * scale, cameraHeight * scale);
        const corners = await findScreen(this.blancoCanvas, coloredCanvas, client.color, true);
        this.screens.push(new SlaveScreen(corners, this.currSlaveID));
        this.prevSlaveID = this.currSlaveID;
        this.currSlaveID = this.slaveIDs.pop();
    }
}