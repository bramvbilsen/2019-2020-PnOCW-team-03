import { client, resetMaster } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import { calculateCameraCanvasScaleFactor, ScaledToFit } from "./camera_util";
import getOrientationAngle from "./orientation_detection/orientation_detection";
import calculateOrientation from "./orientation_detection/orientation_detection_alternative";
import {
    PREFERRED_CANVAS_HEIGHT,
    PREFERRED_CANVAS_WIDTH,
    DEFAULT_NON_COLORED_SLAVE_COLOR,
} from "../CONSTANTS";
import { createCameraOverlayWithPoints } from "../util/canvas";

export enum WorkflowStep {
    BLANCO_IMAGE = "blanco image",
    DISPLAY_SCREEN_COLOR = "display screen color",
    DISPLAY_ORIENTATION_COLOR = "display orientation color",
    REMOVE_SCREEN_COLOR = "remove screen color",
    REMOVE_ORIENTATION_COLOR = "remove orientation color",
    TAKE_AND_PROCESS_SCREEN = "take image and process slave screen",
    TAKE_AND_PROCESS_ORIENTATION = "take image and process slave orientation",
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
    currSlaveScreenFound = false;
    slaveIDs: string[];
    origSlaveIDs: string[];
    step: WorkflowStep;
    blancoCanvas: HTMLCanvasElement;
    screens: SlaveScreen[] = [];
    automated: boolean = false;

    constructor(automated?: boolean) {
        if (automated) {
            this.automated = automated;
        }
        this.step = WorkflowStep.BLANCO_IMAGE;
    }

    public reset() {
        const color = { ...client.color };
        client.color = { r: 76, g: 175, b: 80, a: 255 };
        if (this.prevSlaveID) {
            client.showColorOnSlave(this.prevSlaveID);
        }
        if (this.currSlaveID) {
            client.showColorOnSlave(this.currSlaveID);
        }
        client.color = color;
        $("#slave-flow-buttons").show();
        $("#camera").show();
        $("#display-slave-img-buttons").hide();
        resetMaster();
        this.resetDebug();
    }

    private resetDebug() {
        //@ts-ignore
        window.currentStep = 0;
    }

    private endSlaveCycle() {
        this.prevSlaveID = this.currSlaveID;
        if (this.slaveIDs.length !== 0) {
            this.step = WorkflowStep.DISPLAY_SCREEN_COLOR;
            this.currSlaveID = this.slaveIDs.pop();
            $("#next-slave").show();
            this.currSlaveScreenFound = true;
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

    /**
     * Only for automated flow
     */
    async nextStep() {
        const wait = async () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 5000);
            });
        };
        await wait();
        if (!this.automated) return;
        switch (this.step) {
            case WorkflowStep.BLANCO_IMAGE:
                await this.takeNoColorPicture();
                break;
            case WorkflowStep.DISPLAY_SCREEN_COLOR:
                this.showColorOnNextSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SCREEN:
                await this.takePictureOfColoredScreen();
                break;
            case WorkflowStep.REMOVE_SCREEN_COLOR:
                this.removeScreenColorOnSlave();
                break;
            case WorkflowStep.DISPLAY_ORIENTATION_COLOR:
                this.showOrientationOnSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_ORIENTATION:
                await this.takePictureOfSlaveOrientation();
                break;
            case WorkflowStep.REMOVE_ORIENTATION_COLOR:
                this.removeOrientationColorOnSlave();
                break;
            default:
                console.log(
                    "TRIED EXECUTING UNKOWN/UNWANTED STEP: " + this.step
                );
        }
    }

    async takeNoColorPicture() {
        this.step = WorkflowStep.DISPLAY_SCREEN_COLOR;
        this.initialize();
        this.currSlaveScreenFound = true;
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
        if (this.automated) {
            await this.nextStep();
        }
    }

    /**
     * First we show the color on the slave.
     */
    showColorOnNextSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SCREEN;
        console.log("Showing color on slave");
        client.showColorOnSlave(this.currSlaveID);
    }

    /**
     * Should be called after `showColorOnNextSlave`.
     */
    async takePictureOfColoredScreen() {
        this.step = WorkflowStep.REMOVE_SCREEN_COLOR;
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

        if (corners.length !== 4) {
            this.currSlaveScreenFound = false;
        } else {
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
        }
        $("#show-orientation-button").toggle();
        $("#loading-master-indicator").toggle();
        if (this.automated) {
            await this.nextStep();
        }
    }

    removeScreenColorOnSlave() {
        this.step = WorkflowStep.DISPLAY_ORIENTATION_COLOR;
        client.showColorOnSlave(
            this.currSlaveID,
            DEFAULT_NON_COLORED_SLAVE_COLOR
        );
    }

    showOrientationOnSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_ORIENTATION;
        console.log("showing or colors");
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
    }

    async takePictureOfSlaveOrientation() {
        this.step = WorkflowStep.REMOVE_ORIENTATION_COLOR;
        if (!this.currSlaveScreenFound) {
            if (this.automated) {
                this.nextStep();
            } else {
                this.removeOrientationColorOnSlave();
            }
            return;
        }
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
        const orientation = calculateOrientation(currScreen, orientationCanvas);
        console.log(currScreen.widthEdge.angleBetweenEndpoints);
        if (this.automated) {
            await this.nextStep();
        } else {
            this.removeOrientationColorOnSlave();
        }
    }

    removeOrientationColorOnSlave() {
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
        this.endSlaveCycle();
    }
}
