import { client } from "../../index";
import SlaveScreen from "../util/SlaveScreen";
import calculateScreenAngle from "./orientation_detection/orientation_detection_alternative";
import { CornerLabels } from "../types/Points";
import { Camera } from "../UI/Master/Camera";
import { CameraOverlay } from "../UI/Master/cameraOverlays";
import { findAreaCorners } from "./areaCornerCalculator";

/**
 * An enumeration of all the different steps of the automatic screen detection.
 */
export enum WorkflowStep {
    BLANCO_IMAGE = "blanco image",
    DISPLAY_SCREEN_COLOR = "display screen color",
    DISPLAY_ORIENTATION_COLOR = "display orientation color",
    REMOVE_SCREEN_COLOR = "remove screen color",
    REMOVE_ORIENTATION_COLOR = "remove orientation color",
    TAKE_AND_PROCESS_SCREEN = "take image and process slave screen",
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
    camera: Camera;
    scale = 0.5;

    constructor(camera: Camera) {
        this.step = WorkflowStep.BLANCO_IMAGE;
        this.camera = camera;
    }

    public async startDetection() {
        return new Promise(async (resolve, reject) => {
            // TODO: Handle undefined exceptions whens screen not found
            await this.detectScreens();
            await this.detectOrientations();
            resolve();
        });
    }

    private async detectScreens() {
        const cameraOverlay = new CameraOverlay();
        const ctx = cameraOverlay.elem.getContext("2d");

        this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        for (let i = 0; i < this.slaveIDs.length; i++) {
            const slaveId = this.slaveIDs[i];
            await client.requestColor(
                { r: 0, g: 100, b: 100, a: 255 },
                slaveId
            );
            await wait(1000);
            const firstImg = this.camera.snap(this.scale);
            await client.requestColor({ r: 100, g: 0, b: 0, a: 255 }, slaveId);
            await wait(1000);
            const secondImg = this.camera.snap(this.scale);
            const firstImgCtx = firstImg.getContext("2d");
            const secondImgCtx = secondImg.getContext("2d");
            const firstImgData = firstImgCtx.getImageData(
                0,
                0,
                firstImg.width,
                firstImg.height
            );
            const secondImgData = secondImgCtx.getImageData(
                0,
                0,
                secondImg.width,
                secondImg.height
            );
            let diffPoints = this.camera.detectBigColorDifferences(
                firstImgData,
                secondImgData
            );
            const diffImgData = this.camera.pointsToImgData(
                diffPoints,
                firstImg.width,
                firstImg.height
            );
            diffPoints = this.camera.filter8Neighbors(
                diffPoints,
                diffImgData,
                5
            );
            const areas = this.camera.filterToAreas(diffPoints);
            areas.forEach((area) => {
                ctx.fillStyle = `rgb(${Math.random() * 50}, ${
                    Math.random() * 255
                }, ${Math.random() * 255})`;
                area.forEach((p) =>
                    ctx.fillRect(
                        p.x / this.scale,
                        p.y / this.scale,
                        1 / this.scale,
                        1 / this.scale
                    )
                );
            });
            ctx.fillStyle = "red";
            const areaToWorkWith = areas.sort((a, b) => b.length - a.length)[0];
            areaToWorkWith.forEach((p) => {
                ctx.fillRect(
                    p.x / this.scale,
                    p.y / this.scale,
                    1 / this.scale,
                    1 / this.scale
                );
            });

            const corners = findAreaCorners(
                areaToWorkWith,
                this.camera,
                firstImg.width,
                firstImg.height
            );

            ctx.fillStyle = "blue";
            corners.forEach((corner, index) => {
                if (index == 0) {
                    ctx.fillStyle = "blue";
                } else if (index == 1) {
                    ctx.fillStyle = "green";
                } else if (index == 2) {
                    ctx.fillStyle = "white";
                } else {
                    ctx.fillStyle = "black";
                }
                ctx.beginPath();
                ctx.arc(
                    corner.x / this.scale,
                    corner.y / this.scale,
                    10,
                    0,
                    2 * Math.PI
                );
                ctx.closePath();
                ctx.fill();
            });

            this.screens.push(new SlaveScreen(corners, slaveId));
        }
    }

    private async detectOrientations() {
        const cameraOverlay = new CameraOverlay();
        const ctx = cameraOverlay.elem.getContext("2d");

        await client.requestOrientationColors(this.slaveIDs);
        console.log("Confirmed orientation colors");
        await wait(1000);
        const img = this.camera.snap(this.scale);
        for (let i = 0; i < this.screens.length; i++) {
            const screen = this.screens[i];
            const { angle, ...cornerMapping } = calculateScreenAngle(
                screen,
                img
            );
            screen.angle = angle;
            screen.actualCorners = cornerMapping;
            console.log(screen.angle);
            console.log(
                "Actual Left Up maps to: " +
                    screen.mapActualToMasterCornerLabel(CornerLabels.LeftUp)
            );
            console.log(
                "Actual Right Up maps to: " +
                    screen.mapActualToMasterCornerLabel(CornerLabels.RightUp)
            );
            console.log(
                "Actual Right Under maps to: " +
                    screen.mapActualToMasterCornerLabel(CornerLabels.RightUnder)
            );
            console.log(
                "Actual Left Under maps to: " +
                    screen.mapActualToMasterCornerLabel(CornerLabels.LeftUnder)
            );
        }
    }

    removeOrientationColorOnSlave() {
        this.step = WorkflowStep.END_CYCLE;
        client.toggleOrientationColorsOnSlave(this.currSlaveID);
        if (!this.automated) {
            // this.endSlaveCycle();
        }
    }
}
