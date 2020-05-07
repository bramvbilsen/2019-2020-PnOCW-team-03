import { Camera } from "../UI/Master/Camera";
import SlaveScreen from "../util/SlaveScreen";
import Point from "../image_processing/screen_detection/Point";
import { CameraOverlay } from "../UI/Master/cameraOverlays";
import { getCentroidOf } from "../util/shapes";

export class ScreenTracker {
    scale: number;
    ctx: CanvasRenderingContext2D;
    camera: Camera;
    screen: SlaveScreen;
    edgeRatio: number;

    constructor(
        camera: Camera,
        screen: SlaveScreen,
        edgeRatio: number,
        scale?: number
    ) {
        this.scale = scale || 0.2;
        this.ctx = new CameraOverlay().elem.getContext("2d");
        this.camera = camera;
        this.screen = screen;
        console.log("Edge ratio: " + edgeRatio);
        this.edgeRatio = edgeRatio;
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

    private drawScreen(corners: Point[], center: Point, searchRadius: number) {
        const size = 5;
        const ctx = this.ctx;
        ctx.fillStyle = "red";
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

    track() {
        const cameraWidth = this.camera.videoWidth;
        const cameraHeight = this.camera.videoHeight;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, cameraWidth, cameraHeight);
        const edgeRatio = this.edgeRatio;
        let prevCenter = this.screen.centroid.copy();
        let corners = [
            this.screen.actualCorners.LeftUp.copy(),
            this.screen.actualCorners.RightUp.copy(),
            this.screen.actualCorners.RightUnder.copy(),
            this.screen.actualCorners.LeftUnder.copy(),
        ];
        for (let i = 0; i < corners.length; i++) {
            const corner = corners[i];
            const diagonal = new Point(
                prevCenter.x - corner.x,
                prevCenter.y - corner.y
            );
            const diagonalLength = prevCenter.distanceTo(corner);
            const directionVectorToCenter = new Point(
                diagonal.x / corner.distanceTo(prevCenter),
                diagonal.y / corner.distanceTo(prevCenter)
            );
            corners[i] = new Point(
                corner.x +
                    directionVectorToCenter.x * edgeRatio * diagonalLength,
                corner.y +
                    directionVectorToCenter.y * edgeRatio * diagonalLength
            );
        }
        let cornerSearchRadius =
            (this.findShortestSideLength(corners) / 2) * 0.6;

        this.drawScreen(corners, prevCenter, cornerSearchRadius);

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
                corners.map(
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
            corners = this.camera
                .findCornersInPOI(scaledPrevCenter, cornerAreas)
                .map((c) => new Point(c.x / this.scale, c.y / this.scale));
            prevCenter = getCentroidOf(corners);
            // cornerSearchRadius =
            //     (this.findShortestSideLength(corners) / 2) * 0.6;
            this.drawScreen(corners, prevCenter, cornerSearchRadius);
            ctx.fillStyle = "red";
            ctx.fillText("Frame took: " + (Date.now() - startT) + "ms", 50, 50);
            requestAnimationFrame(trackStep);
        };

        requestAnimationFrame(trackStep);
    }
}
