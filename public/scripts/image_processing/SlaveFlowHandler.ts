import { client } from "../../index";
import SlaveScreen from "../util/SlaveScreen";
import calculateScreenAngle from "./orientation_detection/orientation_detection_alternative";
import { CornerLabels } from "../types/Points";
import { Camera } from "../UI/Master/Camera";
import { CameraOverlay } from "../UI/Master/cameraOverlays";
import { findAreaCorners } from "./areaCornerCalculator";
import Point from "./screen_detection/Point";
import { flattenOneLevel } from "../util/arrays";
import { BoundingBox } from "../util/BoundingBox";
import delauney from "./Triangulation/Delaunay";
import MiddlePoint from "./Triangulation/MiddlePoint";
import { uploadMasterImgCanvas } from "../util/image_uploader";

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
            this.sendDataToClients();
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
                { r: 0, g: 150, b: 150, a: 255 },
                slaveId
            );
            await wait(1000);
            const firstImg = this.camera.snap(this.scale);
            await client.requestColor({ r: 150, g: 0, b: 0, a: 255 }, slaveId);
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

            if (areas.length == 0) {
                continue;
            }

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

            if (corners.length != 4) {
                continue;
            }

            this.screens.push(
                new SlaveScreen(
                    corners.map(
                        (c) => new Point(c.x / this.scale, c.y / this.scale)
                    ),
                    slaveId
                )
            );
        }
    }

    private async detectOrientations() {
        await client.requestOrientationColors(this.slaveIDs);
        console.log("Confirmed orientation colors");
        await wait(1000);
        const img = this.camera.snap(1);
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
        // Upload image in server:
        uploadMasterImgCanvas(img);
    }

    private sendDataToClients() {
        const upscale = 1;
        for (let i = 0; i < this.screens.length; i++) {
            const screen = this.screens[i];
            screen.actualCorners = {
                LeftUp: new Point(
                    screen.actualCorners.LeftUp.x * upscale,
                    screen.actualCorners.LeftUp.y * upscale
                ),
                RightUp: new Point(
                    screen.actualCorners.RightUp.x * upscale,
                    screen.actualCorners.RightUp.y * upscale
                ),
                RightUnder: new Point(
                    screen.actualCorners.RightUnder.x * upscale,
                    screen.actualCorners.RightUnder.y * upscale
                ),
                LeftUnder: new Point(
                    screen.actualCorners.LeftUnder.x * upscale,
                    screen.actualCorners.LeftUnder.y * upscale
                ),
            };
            for (let j = 0; j < screen.corners.length; j++) {
                screen.corners[j] = new Point(
                    screen.corners[j].x * upscale,
                    screen.corners[j].y * upscale
                );
            }
        }

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
