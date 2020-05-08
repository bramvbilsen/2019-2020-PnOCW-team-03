import { Camera } from "../UI/Master/Camera";
import SlaveScreen from "../util/SlaveScreen";
import Point from "../image_processing/screen_detection/Point";
import { CameraOverlay } from "../UI/Master/cameraOverlays";
import { getCentroidOf } from "../util/shapes";
import { slaveFlowHandler } from "../../index";

const linSystem = require("linear-equation-system");

export class ScreenTracker {
    scale: number;
    ctx: CanvasRenderingContext2D;
    camera: Camera;
    screen: SlaveScreen;
    crossRatio: number;
    originalCorners: Point[] = [];
    prevCorners: Point[] = [];
    corners: Point[] = [];
    matrix: Array<Array<number>> = [];
    originalScreens: SlaveScreen[];

    constructor(
        camera: Camera,
        screen: SlaveScreen,
        crossRatio: number,
        scale?: number
    ) {
        this.scale = scale || 0.5;
        this.ctx = new CameraOverlay().elem.getContext("2d");
        this.camera = camera;
        this.screen = screen;
        this.crossRatio = crossRatio;
        this.originalScreens = slaveFlowHandler.screens.map((s) => s.copy());
    }

    private drawCorners(corners: Point[], color?: string) {
        const ctx = this.ctx;
        this.ctx.fillStyle = color || "white";
        for (let i = 0; i < corners.length; i++) {
            ctx.beginPath();
            ctx.arc(corners[i].x, corners[i].y, 5, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
    }

    private drawCornerInformation(
        corner: Point,
        center: Point,
        size: number,
        searchRadius: number
    ) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, size, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(corner.x, corner.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, searchRadius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }

    private drawScreen(
        corners: Point[],
        center: Point,
        searchRadius: number,
        color = "red"
    ) {
        const size = 5;
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.arc(center.x, center.y, size, 0, 2 * Math.PI);
        ctx.closePath();
        corners.forEach((corner, i) =>
            this.drawCornerInformation(corner, center, size, searchRadius)
        );
    }

    private findShortestSideLength(corners: Point[]) {
        let shortest = Number.POSITIVE_INFINITY;
        for (let i = 0; i < corners.length; i++) {
            const c1 = corners[i];
            for (let j = i + 1; j < corners.length; j++) {
                const c2 = corners[j];
                const length = c1.distanceTo(c2);
                if (length < shortest) {
                    shortest = length;
                }
            }
        }
        return shortest;
    }

    private updatePrevCorners() {
        this.prevCorners.length = 0;
        for (let i = 0; i < this.corners.length; i++) {
            this.prevCorners.push(this.corners[i].copy());
        }
    }

    private calcPerspectiveMatrix() {
        const translation = innerWidth * 10;

        const oPTopLeftBottomRightDiagLength = this.originalCorners[0].distanceTo(
            this.originalCorners[2]
        );
        const oPTopLeftBottomRightDiagDirection = new Point(
            (this.originalCorners[0].x - this.originalCorners[2].x) /
                oPTopLeftBottomRightDiagLength,
            (this.originalCorners[0].y - this.originalCorners[2].y) /
                oPTopLeftBottomRightDiagLength
        );
        const oPTopRightBottomLeftDiagLength = this.originalCorners[1].distanceTo(
            this.originalCorners[3]
        );
        const oPTopRightBottomLeftDiagDirection = new Point(
            (this.originalCorners[1].x - this.originalCorners[3].x) /
                oPTopRightBottomLeftDiagLength,
            (this.originalCorners[1].y - this.originalCorners[3].y) /
                oPTopRightBottomLeftDiagLength
        );
        const bigOriginalPoints = [
            new Point(
                this.originalCorners[0].x +
                    oPTopLeftBottomRightDiagDirection.x * translation,
                this.originalCorners[0].y +
                    oPTopLeftBottomRightDiagDirection.y * translation
            ),
            new Point(
                this.originalCorners[1].x +
                    oPTopRightBottomLeftDiagDirection.x * translation,
                this.originalCorners[1].y +
                    oPTopRightBottomLeftDiagDirection.y * translation
            ),
            new Point(
                this.originalCorners[2].x +
                    -oPTopLeftBottomRightDiagDirection.x * translation,
                this.originalCorners[2].y +
                    -oPTopLeftBottomRightDiagDirection.y * translation
            ),
            new Point(
                this.originalCorners[3].x +
                    -oPTopRightBottomLeftDiagDirection.x * translation,
                this.originalCorners[3].y +
                    -oPTopRightBottomLeftDiagDirection.y * translation
            ),
        ];

        const nPTopLeftBottomRightDiagLength = this.corners[0].distanceTo(
            this.corners[2]
        );
        const nPTopLeftBottomRightDiagDirection = new Point(
            (this.corners[0].x - this.corners[2].x) /
                nPTopLeftBottomRightDiagLength,
            (this.corners[0].y - this.corners[2].y) /
                nPTopLeftBottomRightDiagLength
        );
        const nPTopRightBottomLeftDiagLength = this.corners[1].distanceTo(
            this.corners[3]
        );
        const nPTopRightBottomLeftDiagDirection = new Point(
            (this.corners[1].x - this.corners[3].x) /
                nPTopRightBottomLeftDiagLength,
            (this.corners[1].y - this.corners[3].y) /
                nPTopRightBottomLeftDiagLength
        );
        const bigNewPoints = [
            new Point(
                this.corners[0].x +
                    nPTopLeftBottomRightDiagDirection.x * translation,
                this.corners[0].y +
                    nPTopLeftBottomRightDiagDirection.y * translation
            ),
            new Point(
                this.corners[1].x +
                    nPTopRightBottomLeftDiagDirection.x * translation,
                this.corners[1].y +
                    nPTopRightBottomLeftDiagDirection.y * translation
            ),
            new Point(
                this.corners[2].x +
                    -nPTopLeftBottomRightDiagDirection.x * translation,
                this.corners[2].y +
                    -nPTopLeftBottomRightDiagDirection.y * translation
            ),
            new Point(
                this.corners[3].x +
                    -nPTopRightBottomLeftDiagDirection.x * translation,
                this.corners[3].y +
                    -nPTopRightBottomLeftDiagDirection.y * translation
            ),
        ];

        let x0 = bigOriginalPoints[0].x;
        let y0 = bigOriginalPoints[0].y;
        let x1 = bigOriginalPoints[1].x;
        let y1 = bigOriginalPoints[1].y;
        let x2 = bigOriginalPoints[2].x;
        let y2 = bigOriginalPoints[2].y;
        let x3 = bigOriginalPoints[3].x;
        let y3 = bigOriginalPoints[3].y;
        let u0 = bigNewPoints[0].x;
        let v0 = bigNewPoints[0].y;
        let u1 = bigNewPoints[1].x;
        let v1 = bigNewPoints[1].y;
        let u2 = bigNewPoints[2].x;
        let v2 = bigNewPoints[2].y;
        let u3 = bigNewPoints[3].x;
        let v3 = bigNewPoints[3].y;
        let row1 = [x0, y0, 1, 0, 0, 0, -u0 * x0, -u0 * y0];
        let row2 = [0, 0, 0, x0, y0, 1, -v0 * x0, -v0 * y0];
        let row3 = [x1, y1, 1, 0, 0, 0, -u1 * x1, -u1 * y1];
        let row4 = [0, 0, 0, x1, y1, 1, -v1 * x1, -v1 * y1];
        let row5 = [x2, y2, 1, 0, 0, 0, -u2 * x2, -u2 * y2];
        let row6 = [0, 0, 0, x2, y2, 1, -v2 * x2, -v2 * y2];
        let row7 = [x3, y3, 1, 0, 0, 0, -u3 * x3, -u3 * y3];
        let row8 = [0, 0, 0, x3, y3, 1, -v3 * x3, -v3 * y3];

        const c = [u0, v0, u1, v1, u2, v2, u3, v3];

        this.matrix = [row1, row2, row3, row4, row5, row6, row7, row8];
        const h: number[] = linSystem.solve(this.matrix, c);
        return h;
    }

    private WHOOPWHOOP(matrix: number[]) {
        const trackingCentroid = getCentroidOf(this.originalCorners);
        for (let i = 0; i < this.originalScreens.length; i++) {
            const originalScreen = this.originalScreens[i];
            const screenCentroid = originalScreen.centroid;
            const centroidsDist = trackingCentroid.distanceTo(screenCentroid);
            const translationDir = new Point(
                (screenCentroid.x - trackingCentroid.x) / centroidsDist,
                (screenCentroid.y - trackingCentroid.y) / centroidsDist
            );
            let corners = [
                originalScreen.actualCorners.LeftUp,
                originalScreen.actualCorners.RightUp,
                originalScreen.actualCorners.RightUnder,
                originalScreen.actualCorners.LeftUnder,
            ];
            corners = corners.map(
                (p) =>
                    new Point(
                        p.x - translationDir.x * centroidsDist,
                        p.y - translationDir.y * centroidsDist
                    )
            );
            for (let j = 0; j < corners.length; j++) {
                const corner = corners[j];
                const x = corner.x;
                const y = corner.y;
                const div = matrix[6] * x + matrix[7] * y + 1;
                console.log("K: " + div);
                let newX =
                    (matrix[0] * x + matrix[1] * y + matrix[2] * 1) / div;
                let newY =
                    (matrix[3] * x + matrix[4] * y + matrix[5] * 1) / div;
                corners[j] = new Point(newX, newY);
            }
            this.drawCorners(
                corners.map(
                    (p) =>
                        new Point(
                            p.x + translationDir.x * centroidsDist,
                            p.y + translationDir.y * centroidsDist
                        )
                )
            );
        }
    }

    track() {
        const cameraWidth = this.camera.videoWidth;
        const cameraHeight = this.camera.videoHeight;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, cameraWidth, cameraHeight);
        let prevCenter = this.screen.centroid.copy();
        this.corners = [
            this.screen.actualCorners.LeftUp.copy(),
            this.screen.actualCorners.RightUp.copy(),
            this.screen.actualCorners.RightUnder.copy(),
            this.screen.actualCorners.LeftUnder.copy(),
        ];
        // this.drawScreen(this.corners, prevCenter, 0, "green");
        const cornerTranslationInfo = [
            [
                this.screen.actualCorners.LeftUp.distanceTo(
                    this.screen.actualCorners.RightUnder
                ),
                prevCenter.distanceTo(this.screen.actualCorners.LeftUp),
            ],
            [
                this.screen.actualCorners.RightUp.distanceTo(
                    this.screen.actualCorners.LeftUnder
                ),
                prevCenter.distanceTo(this.screen.actualCorners.RightUp),
            ],
            [
                this.screen.actualCorners.RightUnder.distanceTo(
                    this.screen.actualCorners.LeftUp
                ),
                prevCenter.distanceTo(this.screen.actualCorners.RightUnder),
            ],
            [
                this.screen.actualCorners.LeftUnder.distanceTo(
                    this.screen.actualCorners.RightUp
                ),
                prevCenter.distanceTo(this.screen.actualCorners.LeftUnder),
            ],
        ];
        for (let i = 0; i < this.corners.length; i++) {
            const corner = this.corners[i];
            const info = cornerTranslationInfo[i];
            const diagonalLength = info[0];
            const distToCenter = info[1];
            const borderDiagonalLength =
                (diagonalLength * distToCenter * (this.crossRatio - 1)) /
                (this.crossRatio * diagonalLength - distToCenter);

            const toCenterVector = new Point(
                prevCenter.x - corner.x,
                prevCenter.y - corner.y
            );
            const directionVectorToCenter = new Point(
                toCenterVector.x / distToCenter,
                toCenterVector.y / distToCenter
            );
            this.corners[i] = new Point(
                corner.x + directionVectorToCenter.x * borderDiagonalLength,
                corner.y + directionVectorToCenter.y * borderDiagonalLength
            );
            this.originalCorners.push(this.corners[i].copy());
        }

        let cornerSearchRadius =
            (this.findShortestSideLength(this.corners) / 2) * 0.6;

        this.drawScreen(this.corners, prevCenter, cornerSearchRadius);

        const trackStep = () => {
            const startT = Date.now();
            ctx.clearRect(0, 0, cameraWidth, cameraHeight);
            const frame = this.camera.snap(this.scale);
            const frameCtx = frame.getContext("2d");
            const frameImgData = frameCtx.getImageData(
                0,
                0,
                frame.width,
                frame.height
            );
            if (!prevCenter.x || !prevCenter.y) {
                ctx.fillStyle = "red";
                ctx.fillText("LOST POINTS", cameraWidth / 2, cameraHeight / 2);
                return;
            }
            this.updatePrevCorners();
            const scaledPrevCenter = new Point(
                Math.round(prevCenter.x * this.scale),
                Math.round(prevCenter.y * this.scale)
            );
            const edgePixels = this.camera.findEdgesByColorChanges(
                scaledPrevCenter,
                frameImgData
            );
            // ctx.fillStyle = "green";
            // edgePixels.forEach((p) => {
            //     ctx.fillRect(p.x / this.scale, p.y / this.scale, 5, 5);
            // });
            const cornerAreas = this.camera.getAreasOfInterestAroundCorners(
                edgePixels,
                this.corners.map(
                    (c) => new Point(c.x * this.scale, c.y * this.scale)
                ),
                cornerSearchRadius * this.scale
            );
            ctx.fillStyle = "blue";
            cornerAreas.forEach((area) => {
                area.forEach((p) => {
                    ctx.fillRect(
                        p.x / this.scale,
                        p.y / this.scale,
                        1 / this.scale,
                        1 / this.scale
                    );
                });
            });
            this.corners = this.camera
                .findCornersInPOI(scaledPrevCenter, cornerAreas)
                .map((c) => new Point(c.x / this.scale, c.y / this.scale));
            prevCenter = getCentroidOf(this.corners);
            cornerSearchRadius =
                (this.findShortestSideLength(this.corners) / 2) * 0.6;
            this.drawScreen(this.corners, prevCenter, cornerSearchRadius);
            this.WHOOPWHOOP(this.calcPerspectiveMatrix());
            ctx.fillStyle = "red";
            ctx.fillText("Frame took: " + (Date.now() - startT) + "ms", 50, 50);
            requestAnimationFrame(trackStep);
        };

        requestAnimationFrame(trackStep);
    }
}
