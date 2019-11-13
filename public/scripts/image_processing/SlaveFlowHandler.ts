import { client } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import { calculateCameraCanvasScaleFactor } from "./camera_util";
import getOrientationAngle from "./orientation_detection/orientation_detection";
import { PREFERRED_CANVAS_HEIGHT, PREFERRED_CANVAS_WIDTH } from "../CONSTANTS";

export enum WorkflowStep {
    START = "initialize",
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
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;

        const scale = calculateCameraCanvasScaleFactor(
            cameraWidth,
            cameraHeight,
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
        );

        this.blancoCanvas = createCanvas(
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
        );
        const blancoCtx = this.blancoCanvas.getContext("2d");
        blancoCtx.drawImage(
            player[0],
            0,
            0,
            cameraWidth * scale,
            cameraHeight * scale
        );
        $("#result-img").attr("src", this.blancoCanvas.toDataURL());
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
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;
        const scale = calculateCameraCanvasScaleFactor(
            cameraWidth,
            cameraHeight,
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
        );
        const coloredCanvas = createCanvas(
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
        );
        coloredCanvas
            .getContext("2d")
            .drawImage(
                player[0],
                0,
                0,
                cameraWidth * scale,
                cameraHeight * scale
            );
        const corners = await findScreen(
            this.blancoCanvas,
            coloredCanvas,
            client.color,
            client.DEBUG
        );
        this.resetDebug();
        const resultCanvas = createCanvas(
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
        );
        const resultCtx = resultCanvas.getContext("2d");
        resultCtx.drawImage(this.blancoCanvas, 0, 0);
        resultCtx.fillStyle = "rgb(0, 255, 255)";
        corners.forEach(corner => {
            resultCtx.beginPath();
            resultCtx.arc(corner.x, corner.y, 20, 0, Math.PI * 2);
            resultCtx.fill();
            resultCtx.closePath();
        });
        $("#result-img").attr("src", resultCanvas.toDataURL());
        this.screens.push(new SlaveScreen(corners, this.currSlaveID));
    }

    showOrientationOnSlave() {
        client.showOrientationColorsOnSlave(this.currSlaveID);
        this.endSlaveCycle();
    }

    takePictureOfSlaveOrientation() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;
        const scale = calculateCameraCanvasScaleFactor(
            cameraWidth,
            cameraHeight,
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
        );
        const orientationCanvas = createCanvas(
            PREFERRED_CANVAS_WIDTH,
            PREFERRED_CANVAS_HEIGHT
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
