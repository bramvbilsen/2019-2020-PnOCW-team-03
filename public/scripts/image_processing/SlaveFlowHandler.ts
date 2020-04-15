import { client, resetMaster } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import { calculateCameraCanvasScaleFactor, ScaledToFit } from "./camera_util";
import calculateScreenAngle from "./orientation_detection/orientation_detection_alternative";
import {
    PREFERRED_CANVAS_HEIGHT,
    PREFERRED_CANVAS_WIDTH,
    DEFAULT_NON_COLORED_SLAVE_COLOR,
} from "../CONSTANTS";
import { createCameraOverlayWithPoints } from "../util/canvas";
import { CornerLabels } from "../types/Points";
import { BoundingBox } from "../util/BoundingBox";
import { flattenOneLevel } from "../util/arrays";
import Point from "./screen_detection/Point";
import delauney from "./Triangulation/Delaunay";
import Line from "./screen_detection/Line";
import MiddlePoint from "./Triangulation/MiddlePoint";

/**
 * An enumeration of all the different steps of the automatic screen detection.
 */
export enum WorkflowStep {
    BLANCO_IMAGE = "blanco image",
    DISPLAY_PURPLE_COLOR = "display screen color",
    DISPLAY_BLUE_COLOR = "display blue color",
    DISPLAY_ORIENTATION_COLOR = "display orientation color",
    DISPLAY_UPPERLEFT_SQUARE = "display upper left square",
    DISPLAY_UPPERRIGHT_SQUARE = "display upper right square",
    DISPLAY_BOTTOMRIGHT_SQUARE = "display bottom right square",
    DISPLAY_BOTTOMLEFT_SQUARE = "display bottom left square",
    REMOVE_SCREEN_COLOR = "remove screen color",
    REMOVE_ORIENTATION_COLOR = "remove orientation color",
    TAKE_AND_PROCESS_SCREEN = "take image and process slave screen",
    TAKE_AND_PROCESS_SQUARE = "take image and process square on slave",
    TAKE_AND_PROCESS_ORIENTATION = "take image and process slave orientation",
    END_CYCLE = "end slave cycle",
    END = "end",
}

/**
 * Wait for the given amount of time.
 * @param dt This is the deltaTime between the start and end of the wait.
 */
export async function wait(dt: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), dt);
    });
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
    blancoCanvasScale: number;
    screens: SlaveScreen[] = [];
    automated: boolean = false;

    constructor(automated?: boolean) {
        if (automated) {
            this.automated = automated;
        }
        this.step = WorkflowStep.BLANCO_IMAGE;
    }

    /**
     * Resets the colours on all slaves and resets the master.
     */
    public reset() {
        $("#slave-flow-buttons").show();
        $("#camera").show();
        $("#display-slave-img-buttons").hide();
        resetMaster();
        client.slaves.forEach((screen) => {
            console.log("iterating slaves");
            client.resetSlave(screen);
            console.log("resetting:" + screen);
        });
        this.resetDebug();
    }

    /**
     * Resets the debug.
     */
    private resetDebug() {
        //@ts-ignore
        window.currentStep = 0;
    }

    /**
     * Ends the automatic detection for this slave.
     * Either goes on to the next slave in the queue or finishes altogether.
     */
    private endSlaveCycle() {
        this.prevSlaveID = this.currSlaveID;
        if (this.slaveIDs.length !== 0) {
            this.step = WorkflowStep.DISPLAY_PURPLE_COLOR;
            this.currSlaveID = this.slaveIDs.pop();
            if (!this.automated) {
                $("#next-slave").show();
            }
            this.currSlaveScreenFound = true;
        } else {
            this.step = WorkflowStep.END;
            $("#slave-flow-buttons").hide();
            $("#camera").hide();
            $("#display-slave-img-buttons").show();
            const globalBoundingBox = new BoundingBox(
                flattenOneLevel(this.screens.map((screen) => screen.corners))
            );
            console.log("boundingbox shit");
            console.log(globalBoundingBox.width);
            console.log(globalBoundingBox.height);
            this.screens.forEach((screen) => {
                client.sendCutData(
                    {
                        LeftUp: screen.actualCorners.LeftUp.copyTranslated(
                            -globalBoundingBox.topLeft.x,
                            -globalBoundingBox.topLeft.y
                        ).toInterface(),
                        RightUp: screen.actualCorners.RightUp.copyTranslated(
                            -globalBoundingBox.topLeft.x,
                            -globalBoundingBox.topLeft.y
                        ).toInterface(),
                        RightUnder: screen.actualCorners.RightUnder.copyTranslated(
                            -globalBoundingBox.topLeft.x,
                            -globalBoundingBox.topLeft.y
                        ).toInterface(),
                        LeftUnder: screen.actualCorners.LeftUnder.copyTranslated(
                            -globalBoundingBox.topLeft.x,
                            -globalBoundingBox.topLeft.y
                        ).toInterface(),
                    },
                    globalBoundingBox.width,
                    globalBoundingBox.height,
                    screen.slaveID
                );
            });
            //info van de triangulatie sturen
            let middlePoints: Point[] = [];
            this.screens.forEach((slave) => {
                let centroid = slave.centroid;
                middlePoints.push(
                    centroid.copyTranslated(
                        -globalBoundingBox.topLeft.x,
                        -globalBoundingBox.topLeft.y
                    )
                );
            });
            middlePoints.sort(function (a, b) {
                if (a.x - b.x == 0) {
                    return a.y - b.y;
                } else {
                    return a.x - b.x;
                }
            });
            //TODO: dit efficienter maken
            const triangulation = delauney(middlePoints);
            console.log("triangulation = " + triangulation.lines);
            this.screens.forEach((screen) => {
                let sendData = triangulation.sendData(
                    screen,
                    this.screens,
                    globalBoundingBox.topLeft
                );
                client.sendTriangulationData(
                    sendData.lines,
                    sendData.point,
                    sendData.ID
                );
                console.log("sendata = " + sendData.triang);
                client.animation.middlePoints.push(
                    new MiddlePoint(sendData.middlePoint, sendData.triang)
                );
            });
        }
    }

    /**
     * Initialises automatic slave screen detection.
     */
    private initialize() {
        const startButton: JQuery<HTMLButtonElement> = $("#start");
        startButton.css("display", "none");
        this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        this.origSlaveIDs = [...this.slaveIDs];
        this.currSlaveID = this.slaveIDs.pop();
    }

    /**
     * Execute the next step of the automated screen detection.
     * See enumeration of steps.
     * (Only for automated flow!)
     */
    async nextStep() {
        if (!this.automated) return;
        if (this.automated) {
            await wait(2500);
        }
        switch (this.step) {
            case WorkflowStep.BLANCO_IMAGE:
                console.log("AUTOMATED: TAKING BLANCO PICTURE");
                await this.takeNoColorPicture();
                break;
            // PURPLE
            case WorkflowStep.DISPLAY_PURPLE_COLOR:
                console.log("AUTOMATED: DISPLAYING COLOR");
                this.showPurpleColorOnNextSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SCREEN:
                console.log("AUTOMATED: TAKING PICTURE & PROCESSING SCREEN");
                await this.takePictureAndFindColoredScreen();
                break;
            case WorkflowStep.REMOVE_SCREEN_COLOR:
                console.log("AUTOMATED: REMOVING COLOR");
                this.removeScreenColorOnSlave();
                break;
            // BLUE
            case WorkflowStep.DISPLAY_BLUE_COLOR:
                console.log("AUTOMATED: DISPLAYING COLOR");
                this.showBlueColorOnNextSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SCREEN:
                console.log("AUTOMATED: TAKING PICTURE & PROCESSING SCREEN");
                await this.takePictureAndFindColoredScreen();
                break;
            case WorkflowStep.REMOVE_SCREEN_COLOR:
                console.log("AUTOMATED: REMOVING COLOR");
                this.removeScreenColorOnSlave();
                break;
            // UPPERLEFT_SQUARE
            case WorkflowStep.DISPLAY_UPPERLEFT_SQUARE:
                console.log("AUTOMATED: DISPLAYING UPPER LEFT SQUARE");
                this.displayUpperLeftSquareOnSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SQUARE:
                console.log("AUTOMATED: TAKING PICTURE & PROCESSING SQUARE");
                this.takePictureAndFindSquare(
                    WorkflowStep.DISPLAY_UPPERLEFT_SQUARE
                );
                break;
            // UPPERRIGHT_SQUARE
            case WorkflowStep.DISPLAY_UPPERRIGHT_SQUARE:
                console.log("AUTOMATED: DISPLAYING UPPER RIGHT SQUARE");
                this.displayUpperRightSquareOnSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SQUARE:
                console.log("AUTOMATED: TAKING PICTURE & PROCESSING SQUARE");
                this.takePictureAndFindSquare(
                    WorkflowStep.DISPLAY_UPPERRIGHT_SQUARE
                );
                break;
            // BOTTOMRIGHT_SQUARE
            case WorkflowStep.DISPLAY_BOTTOMRIGHT_SQUARE:
                console.log("AUTOMATED: DISPLAYING BOTTOM RIGHT SQUARE");
                this.displayBottomRightSquareOnSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SQUARE:
                console.log("AUTOMATED: TAKING PICTURE & PROCESSING SQUARE");
                this.takePictureAndFindSquare(
                    WorkflowStep.DISPLAY_BOTTOMRIGHT_SQUARE
                );
                break;
            // BOTTOMLEFT_SQUARE
            case WorkflowStep.DISPLAY_BOTTOMLEFT_SQUARE:
                console.log("AUTOMATED: DISPLAYING BOTTOM LEFT SQUARE");
                this.displayBottomLeftSquareOnSlave();
                break;
            case WorkflowStep.TAKE_AND_PROCESS_SQUARE:
                console.log("AUTOMATED: TAKING PICTURE & PROCESSING SQUARE");
                this.takePictureAndFindSquare(
                    WorkflowStep.DISPLAY_BOTTOMLEFT_SQUARE
                );
                break;
            // TODO Bram Maarten: behouden we dit nog ?
            // case WorkflowStep.DISPLAY_ORIENTATION_COLOR:
            //     console.log("AUTOMATED: DISPLAYING ORIENTATION COLOR");
            //     this.showOrientationOnSlave();
            //     break;
            // case WorkflowStep.TAKE_AND_PROCESS_ORIENTATION:
            //     console.log(
            //         "AUTOMATED: TAKING PICTURE & PROCESSING ORIENTATION"
            //     );
            //     await this.takePictureOfSlaveOrientation();
            //     break;
            // case WorkflowStep.REMOVE_ORIENTATION_COLOR:
            //     console.log("AUTOMATED: REMOVE ORIENTATION COLOR");
            //     this.removeOrientationColorOnSlave();
            //     break;
            case WorkflowStep.END_CYCLE:
                console.log("AUTOMATED: ENDING CYLCE");
                this.endSlaveCycle();
                break;
            default:
                console.log(
                    "TRIED EXECUTING UNKOWN/UNWANTED STEP: " + this.step
                );
        }
    }

    /**
     * Takes the general picture of all screens in their default state.
     */
    async takeNoColorPicture() {
        this.step = WorkflowStep.DISPLAY_PURPLE_COLOR;
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
        this.blancoCanvasScale = scale;
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
     * Show the purple colour on the next slave.
     */
    showPurpleColorOnNextSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SCREEN;
        console.log("Showing color on slave");
        client.showColorOnSlave(this.currSlaveID);
    }

    /**
     * Show the blue colour on the next slave.
     */
    showBlueColorOnNextSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SCREEN;
        console.log("Showing color on slave");
        client.showColorOnSlave(this.currSlaveID); // TODO Bram Maarten: geef de blauwe kleur mee als 2e param (zie todo in CONSTANTS.ts)
    }

    /**
     * Take a picture of the slave screens.
     * Assumes that one screen will be coloured.
     * --> Should be called after `showColorOnNextSlave`.
     */
    async takePictureAndFindColoredScreen() {
        // TODO Bram Maarten: zorg ervoor dat je kunt meegeven of je nu purple of blue wilt scannen (zie todo in CONSTANTS.ts).
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
        console.log("Screen found: " + this.currSlaveScreenFound);
        $("#show-orientation-button").toggle();
        $("#loading-master-indicator").toggle();
        if (this.automated) {
            await this.nextStep();
        } else {
            this.removeScreenColorOnSlave();
        }
    }

    async takePictureAndFindSquare(previousStep: WorkflowStep) {
        switch (previousStep) {
            case WorkflowStep.DISPLAY_UPPERLEFT_SQUARE:
                this.step = WorkflowStep.DISPLAY_UPPERRIGHT_SQUARE;
                break;
            case WorkflowStep.DISPLAY_UPPERRIGHT_SQUARE:
                this.step = WorkflowStep.DISPLAY_BOTTOMRIGHT_SQUARE;
                break;
            case WorkflowStep.DISPLAY_BOTTOMRIGHT_SQUARE:
                this.step = WorkflowStep.DISPLAY_BOTTOMLEFT_SQUARE;
                break;
            case WorkflowStep.DISPLAY_BOTTOMLEFT_SQUARE:
                this.step = WorkflowStep.END_CYCLE;
                break;
        }
        // TODO Bram Maarten: werk af
    }

    removeScreenColorOnSlave() {
        this.step = WorkflowStep.DISPLAY_ORIENTATION_COLOR;
        client.showColorOnSlave(
            this.currSlaveID,
            DEFAULT_NON_COLORED_SLAVE_COLOR
        );
    }

    // TODO Bram Maarten: voor de komende functies denk ik dat het slimmer is om 1 functie te hebben met een enumeration voor
    // de square posities. Bijvoorbeeld: displaySquareOnSlave(SQUAREPOSITIONS.UPPER_LEFT)
    displayUpperLeftSquareOnSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SQUARE;
        // TODO Bram Maarten: maak eerst achtergrond opnieuw helemaal blauw
        console.log("Showing upper left square on slave");
        // TODO Bram Maarten: werk af
    }

    displayUpperRightSquareOnSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SQUARE;
        // TODO Bram Maarten: maak eerst achtergrond opnieuw helemaal blauw
        console.log("Showing upper right square on slave");
        // TODO Bram Maarten: werk af
    }

    displayBottomRightSquareOnSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SQUARE;
        // TODO Bram Maarten: maak eerst achtergrond opnieuw helemaal blauw
        console.log("Showing bottom right square on slave");
        // TODO Bram Maarten: werk af
    }

    displayBottomLeftSquareOnSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_SQUARE;
        // TODO Bram Maarten: maak eerst achtergrond opnieuw helemaal blauw
        console.log("Showing bottom left square on slave");
        // TODO Bram Maarten: werk af
    }

    showOrientationOnSlave() {
        this.step = WorkflowStep.TAKE_AND_PROCESS_ORIENTATION;
        console.log("showing or colors");
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
    }

    /**
     * Takes a picture of the screens.
     * Assumes that one screen displays the correct orientation colours.
     */
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
        const { angle, ...cornerMapping } = calculateScreenAngle(
            currScreen,
            orientationCanvas
        );
        currScreen.angle = angle;
        currScreen.actualCorners = cornerMapping;
        console.log(currScreen.angle);
        console.log(
            "Actual Left Up maps to: " +
                currScreen.mapActualToMasterCornerLabel(CornerLabels.LeftUp)
        );
        console.log(
            "Actual Right Up maps to: " +
                currScreen.mapActualToMasterCornerLabel(CornerLabels.RightUp)
        );
        console.log(
            "Actual Right Under maps to: " +
                currScreen.mapActualToMasterCornerLabel(CornerLabels.RightUnder)
        );
        console.log(
            "Actual Left Under maps to: " +
                currScreen.mapActualToMasterCornerLabel(CornerLabels.LeftUnder)
        );
        if (this.automated) {
            await this.nextStep();
        } else {
            this.removeOrientationColorOnSlave();
        }
    }

    removeOrientationColorOnSlave() {
        this.step = WorkflowStep.END_CYCLE;
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
        if (!this.automated) {
            this.endSlaveCycle();
        }
    }
}
