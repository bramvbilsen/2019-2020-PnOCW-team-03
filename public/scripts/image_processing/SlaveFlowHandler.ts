import { client } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import { calculateCameraCanvasScaleFactor, ScaledToFit } from "./camera_util";
import getOrientationAngle from "./orientation_detection/orientation_detection";
import { PREFERRED_CANVAS_HEIGHT, PREFERRED_CANVAS_WIDTH } from "../CONSTANTS";
import { createCameraOverlayWithPoints } from "../util/canvas";

export enum WorkflowStep {
    START = "initialize",
    SLAVE_CYCLE = "iterating through slaves",
    END = "end",
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
    origSlaveIDs: string[];
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
        $("#loading-master-indicator").css("display", "none");
        $("#player-overlay").removeAttr("src");
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
        if (this.slaveIDs.length !== 0) {
            this.currSlaveID = this.slaveIDs.pop();
            $("#next-slave").show();
        } else {
            this.step = WorkflowStep.END;
            $("#slave-flow-buttons").hide();
            $("#camera").hide();
            $("#display-slave-img-buttons").show();
        }
    }

    private initialize() {
        const startButton: JQuery<HTMLButtonElement> = $("#start");
        startButton.css("display", "none");
        this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        this.origSlaveIDs = [...this.slaveIDs];
        this.currSlaveID = this.slaveIDs.pop();
    }

    takeNoColorPicture() {
        this.initialize();
        const player: JQuery<HTMLVideoElement> = $("#player");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;

        const { scale } = calculateCameraCanvasScaleFactor(
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
        client.showColorOnSlave(this.currSlaveID);
    }

    /**
     * Should be called after `showColorOnNextSlave`.
     */
    async takePictureOfColoredScreen() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;
        const { scale, along: scaledAlong } = calculateCameraCanvasScaleFactor(
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
        const resultCanvasWithBg = createCameraOverlayWithPoints(
            corners,
            cameraWidth,
            cameraHeight,
            scale,
            scaledAlong,
            this.blancoCanvas
        );
        const resultCanvas = createCameraOverlayWithPoints(
            corners,
            cameraWidth,
            cameraHeight,
            scale,
            scaledAlong
        );
        $("#result-img").attr("src", resultCanvasWithBg.toDataURL());
        $("#player-overlay").attr("src", resultCanvas.toDataURL());

        this.screens.push(new SlaveScreen(corners, this.currSlaveID));
        $("#show-orientation-button").toggle();
        $("#loading-master-indicator").toggle();
    }

    showOrientationOnSlave() {
        console.log("showing or colors");
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
    }

    takePictureOfSlaveOrientation() {
        const player: JQuery<HTMLVideoElement> = $("#player");
        const cameraWidth = player[0].videoWidth,
            cameraHeight = player[0].videoHeight;
        const { scale } = calculateCameraCanvasScaleFactor(
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
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
        this.endSlaveCycle();
    }
}
