import { Camera } from "../UI/Master/Camera";
import SlaveScreen from "../util/SlaveScreen";
import Point from "../image_processing/screen_detection/Point";
import { CameraOverlay } from "../UI/Master/cameraOverlays";

export class ScreenTracker {
    scale: number;
    ctx: CanvasRenderingContext2D;
    camera: Camera;
    screen: SlaveScreen;
    screenInnerWidth: number;
    screenInnerHeight: number;

    constructor(
        camera: Camera,
        screen: SlaveScreen,
        screenInnerWidth: number,
        screenInnerHeight: number,
        scale?: number
    ) {
        this.scale = scale || 0.2;
        this.ctx = new CameraOverlay().elem.getContext("2d");
        this.camera = camera;
        this.screen = screen;
        this.screenInnerWidth = screenInnerWidth;
        this.screenInnerHeight = screenInnerHeight;
        console.log("Scale: " + scale);
    }

    private drawCornerInformation(
        corner: Point,
        size: number,
        searchRadius: number
    ) {
        const ctx = this.ctx;
        const center = this.screen.centroid;
        ctx.fillRect(corner.x, corner.y, size, size);
        ctx.beginPath();
        ctx.moveTo(center.x + size / 2, center.y + size / 2);
        ctx.lineTo(corner.x + size / 2, corner.y + size / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            corner.x + size / 2,
            corner.y + size / 2,
            searchRadius,
            0,
            2 * Math.PI
        );
        ctx.closePath();
        ctx.stroke();
    }

    private drawScreen(cornersSearchRadii: number[]) {
        const size = 20;
        const ctx = this.ctx;
        const center = this.screen.centroid;
        ctx.fillStyle = "red";
        ctx.strokeStyle = "blue";
        ctx.fillRect(center.x, center.y, size, size);
        console.log("Drawing top left: ");
        console.log(this.screen.actualCorners.LeftUp);
        this.drawCornerInformation(
            this.screen.actualCorners.LeftUp,
            size,
            cornersSearchRadii[0]
        );
        this.drawCornerInformation(
            this.screen.actualCorners.RightUp,
            size,
            cornersSearchRadii[1]
        );
        this.drawCornerInformation(
            this.screen.actualCorners.RightUnder,
            size,
            cornersSearchRadii[2]
        );
        this.drawCornerInformation(
            this.screen.actualCorners.LeftUnder,
            size,
            cornersSearchRadii[3]
        );
    }

    track() {
        const cameraWidth = this.camera.videoWidth;
        const cameraHeight = this.camera.videoHeight;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, cameraWidth, cameraHeight);
        const slaveEdgeSize = 125;
        const screenDiagonal =
            Math.sqrt(
                (this.screenInnerWidth / 2) * (this.screenInnerWidth / 2) +
                    (this.screenInnerHeight / 2) * (this.screenInnerHeight / 2)
            ) - slaveEdgeSize;
        const edgeRatio = slaveEdgeSize / screenDiagonal;
        let prevCenter = this.screen.centroid;
        let cToM = new Point(
            (this.screen.centroid.x - this.screen.actualCorners.LeftUp.x) /
                this.screen.actualCorners.LeftUp.distanceTo(
                    this.screen.centroid
                ),
            (this.screen.centroid.y - this.screen.actualCorners.LeftUp.y) /
                this.screen.actualCorners.LeftUp.distanceTo(
                    this.screen.centroid
                )
        );
        let diameter =
            this.screen.actualCorners.LeftUp.distanceTo(prevCenter) *
            edgeRatio *
            2;
        this.screen.actualCorners.LeftUp = new Point(
            this.screen.actualCorners.LeftUp.x + cToM.x * diameter,
            this.screen.actualCorners.LeftUp.y + cToM.y * diameter
        );
        cToM = new Point(
            (this.screen.centroid.x - this.screen.actualCorners.RightUp.x) /
                this.screen.actualCorners.RightUp.distanceTo(
                    this.screen.centroid
                ),
            (this.screen.centroid.y - this.screen.actualCorners.RightUp.y) /
                this.screen.actualCorners.RightUp.distanceTo(
                    this.screen.centroid
                )
        );
        diameter =
            this.screen.actualCorners.RightUp.distanceTo(prevCenter) *
            edgeRatio *
            2;
        this.screen.actualCorners.RightUp = new Point(
            this.screen.actualCorners.RightUp.x + cToM.x * diameter,
            this.screen.actualCorners.RightUp.y + cToM.y * diameter
        );
        cToM = new Point(
            (this.screen.centroid.x - this.screen.actualCorners.RightUnder.x) /
                this.screen.actualCorners.RightUnder.distanceTo(
                    this.screen.centroid
                ),
            (this.screen.centroid.y - this.screen.actualCorners.RightUnder.y) /
                this.screen.actualCorners.RightUnder.distanceTo(
                    this.screen.centroid
                )
        );
        diameter =
            this.screen.actualCorners.RightUnder.distanceTo(prevCenter) *
            edgeRatio *
            2;
        this.screen.actualCorners.RightUnder = new Point(
            this.screen.actualCorners.RightUnder.x + cToM.x * diameter,
            this.screen.actualCorners.RightUnder.y + cToM.y * diameter
        );
        cToM = new Point(
            (this.screen.centroid.x - this.screen.actualCorners.LeftUnder.x) /
                this.screen.actualCorners.LeftUnder.distanceTo(
                    this.screen.centroid
                ),
            (this.screen.centroid.y - this.screen.actualCorners.LeftUnder.y) /
                this.screen.actualCorners.LeftUnder.distanceTo(
                    this.screen.centroid
                )
        );
        diameter =
            this.screen.actualCorners.LeftUnder.distanceTo(prevCenter) *
            edgeRatio *
            2;
        this.screen.actualCorners.LeftUnder = new Point(
            this.screen.actualCorners.LeftUnder.x + cToM.x * diameter,
            this.screen.actualCorners.LeftUnder.y + cToM.y * diameter
        );
        // IMPORTANT! Clockwise order.
        const cornersSearchRadii: number[] = [
            this.screen.actualCorners.LeftUp.distanceTo(prevCenter) *
                edgeRatio *
                2,
            this.screen.actualCorners.RightUp.distanceTo(prevCenter) *
                edgeRatio *
                2,
            this.screen.actualCorners.RightUnder.distanceTo(prevCenter) *
                edgeRatio *
                2,
            this.screen.actualCorners.LeftUnder.distanceTo(prevCenter) *
                edgeRatio *
                2,
        ];
        this.drawScreen(cornersSearchRadii);

        let canTrack = true;
        const interval = setInterval(() => {
            if (!canTrack) return;
            canTrack = false;
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
            prevCenter = this.screen.centroid;
            if (!prevCenter.x || !prevCenter.y) {
                clearInterval(interval);
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
            ctx.fillStyle = "green";
            edgePixels.forEach((p) => {
                ctx.fillRect(p.x / this.scale, p.y / this.scale, 10, 10);
            });
            const cornerAreas = this.camera.getAreasOfInterestAroundCorners(
                edgePixels,
                [
                    new Point(
                        this.screen.actualCorners.LeftUp.x * this.scale,
                        this.screen.actualCorners.LeftUp.y * this.scale
                    ),
                    new Point(
                        this.screen.actualCorners.RightUp.x * this.scale,
                        this.screen.actualCorners.RightUp.y * this.scale
                    ),
                    new Point(
                        this.screen.actualCorners.RightUnder.x * this.scale,
                        this.screen.actualCorners.RightUnder.y * this.scale
                    ),
                    new Point(
                        this.screen.actualCorners.LeftUnder.x * this.scale,
                        this.screen.actualCorners.LeftUnder.y * this.scale
                    ),
                ],
                cornersSearchRadii.map((d) => d * this.scale)
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
            const newCorners = this.camera.findCornersInPOI(
                scaledPrevCenter,
                cornerAreas
            );
            this.screen.corners = newCorners.map(
                (c) => new Point(c.x / this.scale, c.y / this.scale)
            );
            console.log("Found corners (scaled): ");
            console.log(newCorners);
            console.log("Found corners: ");
            console.log(this.screen.corners);
            this.screen.actualCorners.LeftUp = new Point(
                newCorners[0].x / this.scale,
                newCorners[0].y / this.scale
            );
            this.screen.actualCorners.RightUp = new Point(
                newCorners[1].x / this.scale,
                newCorners[1].y / this.scale
            );
            this.screen.actualCorners.RightUnder = new Point(
                newCorners[2].x / this.scale,
                newCorners[2].y / this.scale
            );
            this.screen.actualCorners.LeftUnder = new Point(
                newCorners[3].x / this.scale,
                newCorners[3].y / this.scale
            );
            const newCenter = this.screen.centroid;
            cornersSearchRadii.length = 0;
            cornersSearchRadii.push(
                this.screen.actualCorners.LeftUp.distanceTo(newCenter) *
                    edgeRatio *
                    2
            );
            cornersSearchRadii.push(
                this.screen.actualCorners.RightUp.distanceTo(newCenter) *
                    edgeRatio *
                    2
            );
            cornersSearchRadii.push(
                this.screen.actualCorners.RightUnder.distanceTo(newCenter) *
                    edgeRatio *
                    2
            );
            cornersSearchRadii.push(
                this.screen.actualCorners.LeftUnder.distanceTo(newCenter) *
                    edgeRatio *
                    2
            );
            this.drawScreen(cornersSearchRadii);
            canTrack = true;
            ctx.fillStyle = "red";
            ctx.fillText("Frame took: " + (Date.now() - startT) + "ms", 50, 50);
        });
    }
}
