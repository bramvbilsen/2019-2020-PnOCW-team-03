import { client } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import { calculateCameraCanvasScaleFactor } from "./camera_util";
import getOrientationAngle from "./orientation_detection/orientation_detection";

export enum WorkflowStep {
    START = "initialize",
    SLAVE_CYCLE = "iterating through slaves"
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

    public reset() {
        $("#capture").css("capture-slave", "none");
        $("#next-slave").css("display", "none");
        $("#show-orientation-button").css("display", "none");
        $("#capture-orientation").css("display", "none");
        $("#start").css("display", "inherit");
        const color = { ...client.color };
        client.color = { r: 255, g: 255, b: 255, a: 255 };
        if (this.prevSlaveID) {
            client.showColorOnSlave(this.prevSlaveID);
        }
        if (this.currSlaveID) {
            client.showColorOnSlave(this.currSlaveID);
        }
        client.color = color;
        this.resetDebug();
    }

    private resetDebug() {
        //@ts-ignore
        window.currentStep = 0;
    }

    private endSlaveCycle() {
        this.prevSlaveID = this.currSlaveID;
        this.currSlaveID = this.slaveIDs.pop();
    }

    private initialize() {
        const startButton: JQuery<HTMLButtonElement> = $("#start");
        startButton.css("display", "none");
        this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        this.currSlaveID = this.slaveIDs.pop();
    }

    takeNoColorPicture() {
        this.initialize();
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;

        const scale = calculateCameraCanvasScaleFactor(
            cameraWidth,
            cameraHeight,
            canvas[0].width,
            canvas[0].height
        );

        const context = canvas[0].getContext("2d");
        context.drawImage(
            player[0],
            0,
            0,
            cameraWidth * scale,
            cameraHeight * scale
        );

        this.blancoCanvas = createCanvas(canvas[0].width, canvas[0].height);
        const blancoCtx = this.blancoCanvas.getContext("2d");
        blancoCtx.drawImage(
            player[0],
            0,
            0,
            cameraWidth * scale,
            cameraHeight * scale
        );
        this.step = WorkflowStep.SLAVE_CYCLE;
    }

    /**
     * First we show the color on the slave.
     */
    showColorOnNextSlave() {
        console.log("Showing color on slave");
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
        console.log("Capturing color on slave");
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;
        const scale = calculateCameraCanvasScaleFactor(
            cameraWidth,
            cameraHeight,
            canvas[0].width,
            canvas[0].height
        );
        const coloredCanvas = createCanvas(canvas[0].width, canvas[0].height);
        coloredCanvas
            .getContext("2d")
            .drawImage(
                player[0],
                0,
                0,
                cameraWidth * scale,
                cameraHeight * scale
            );
        console.log(client.color);
        const corners = await findScreen(
            this.blancoCanvas,
            coloredCanvas,
            client.color,
            client.DEBUG
        );
        this.resetDebug();
        const ctx = canvas[0].getContext("2d");
        ctx.drawImage(this.blancoCanvas, 0, 0);
        ctx.fillStyle = "rgb(0, 255, 255)";
        corners.forEach(corner => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });
        this.screens.push(new SlaveScreen(corners, this.currSlaveID));
    }

    showOrientationOnSlave() {
        client.showOrientationColorsOnSlave(this.currSlaveID);
        this.endSlaveCycle();
    }

    takePictureOfSlaveOrientation() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;
        const scale = calculateCameraCanvasScaleFactor(
            cameraWidth,
            cameraHeight,
            canvas[0].width,
            canvas[0].height
        );
        const orientationCanvas = createCanvas(
            canvas[0].width,
            canvas[0].height
        );
        orientationCanvas
            .getContext("2d")
            .drawImage(
                player[0],
                0,
                0,
                cameraWidth * scale,
                cameraHeight * scale
            );
        const currScreen = this.screens[this.screens.length - 1];
        currScreen.orientation = getOrientationAngle(
            currScreen,
            orientationCanvas
        );
        console.log(currScreen.orientation);
    }
}
