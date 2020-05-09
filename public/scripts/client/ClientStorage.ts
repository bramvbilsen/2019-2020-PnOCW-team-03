import Line from "../image_processing/screen_detection/Line";
import MiddlePoint from "../image_processing/Triangulation/MiddlePoint";
import Point from "../image_processing/screen_detection/Point";
import p5 from "p5";
import { client } from "../../index";
import { matrixMultiplication3x3 } from "../util/matrix";

const linSystem = require("linear-equation-system");

/**
 * Handles the organization of the coordinates of the four corner points.
 */
interface SrcPoints {
    LeftUp: { x: number; y: number };
    RightUp: { x: number; y: number };
    LeftUnder: { x: number; y: number };
    RightUnder: { x: number; y: number };
}

export default class ClientStorage {
    originalBoundingBoxWidth: number;
    originalBoundingBoxHeight: number;
    matrix3d: string;
    srcPoints: SrcPoints;
    triangulation: {
        lines: Line[];
        points: Point[];
    };
    //animation stuff
    positionBall: Point;
    eenheidsVector: Point;
    animation: p5;
    distancePerFrame = 1;
    endTime: number;
    stopTime = Date.now();
    lastFrameTime: number;

    constructor() {
        //this.animating = false;
        //p5 initialiseren
    }

    animate(
        startTime: number,
        endTime: number,
        newPosition: Point,
        newUnitVector: Point
    ) {
        const arrivelTime = Date.now();
        console.log("Animation gestart");
        console.log("start= " + new Date(startTime));
        const eta_ms = startTime - arrivelTime;
        console.log("PUNTEEEEEEN");
        console.log(newPosition.x);
        console.log(newPosition.y);
        console.log("VECTOOOOOOOOOOR");
        console.log(newUnitVector.x);
        console.log(newUnitVector.y);
        setTimeout(() => {
            if (this.stopTime - arrivelTime <= 0) {
                this.positionBall = newPosition;
                this.eenheidsVector = newUnitVector;
                this.endTime = endTime;
                this.animation.loop();
            }
            //this.animation.noLoop();
        }, eta_ms);
    }
    startAnimation() {
        client.hideAllSlaveLayers();
        client.moveToForeground("animation");
    }

    stopAnimation() {
        client.moveToBackground("animation");
        client.hideAllSlaveLayers();
        client.moveToForeground("default-slave-state");
        this.animation.noLoop();
        this.positionBall = undefined;
        this.stopTime = Date.now();
        this.lastFrameTime = undefined;
    }

    public animationSketch = (p: p5) => {
        p.setup = () => {
            const fps = 30;
            p.frameRate(fps);
            const p5Canvas = p.createCanvas(
                this.originalBoundingBoxWidth,
                this.originalBoundingBoxHeight
            );
            p5Canvas.id("animation");
            const htmlcanvas = document.getElementById("animation");
            htmlcanvas.style.transform = this.matrix3d;
            htmlcanvas.style.transformOrigin = "0 0";
            p.noLoop();
        };

        p.draw = () => {
            let deltaTime;
            if (this.positionBall) {
                if (!this.lastFrameTime) {
                    this.lastFrameTime = performance.now();
                    deltaTime = 1;
                } else {
                    const currentTime = performance.now();
                    deltaTime = (currentTime - this.lastFrameTime) / 33.33;
                    this.lastFrameTime = currentTime;
                }
            }
            //clearen
            p.clear();
            p.stroke("blue");
            //lijnen en punten tekenen
            if (this.triangulation) {
                for (let i = 0; i < this.triangulation.points.length; i++) {
                    const element = this.triangulation.points[i];
                    p.point(element.x, element.y);
                }
                for (let i = 0; i < this.triangulation.lines.length; i++) {
                    const element = this.triangulation.lines[i].endPoints;
                    p.line(
                        element[0].x,
                        element[0].y,
                        element[1].x,
                        element[1].y
                    );
                }
            }
            //bal tekenen
            if (this.positionBall) {
                if (this.endTime - Date.now() > 0) {
                    p.stroke(0, 0, 0, 0);
                    p.fill("blue");
                    p.ellipse(this.positionBall.x, this.positionBall.y, 10, 10);
                    const dx =
                        this.distancePerFrame *
                        this.eenheidsVector.x *
                        deltaTime;
                    const dy =
                        this.distancePerFrame *
                        this.eenheidsVector.y *
                        deltaTime;
                    this.positionBall = new Point(
                        this.positionBall.x + dx,
                        this.positionBall.y + dy
                    );
                } else {
                    p.noLoop();
                    this.lastFrameTime = undefined;
                }
            }
        };
    };

    /**
     * Updates this ClientStorage instance with the new, given data.
     * @param boundingBoxWidth The width of the bounding box.
     * @param boundingBoxHeight The height of the bounding box.
     * @param begin A SrcPoints instantiation holding the four corner points.
     */
    newData(
        boundingBoxWidth: number,
        boundingBoxHeight: number,
        begin: SrcPoints
    ) {
        if (!this.originalBoundingBoxWidth) {
            this.originalBoundingBoxHeight = boundingBoxHeight;
            this.originalBoundingBoxWidth = boundingBoxWidth;
        }
        console.log("boundingbox new data");
        console.log(boundingBoxWidth);
        console.log(boundingBoxHeight);
        const yScale = boundingBoxHeight / this.originalBoundingBoxHeight;
        const xScale = boundingBoxWidth / this.originalBoundingBoxWidth;
        const perspectiveMatrixRes = this.perspectiveMatrix(
            begin,
            xScale || 1,
            yScale || 1
        );
        this.matrix3d = perspectiveMatrixRes;
        this.srcPoints = begin;
        const perspectiveElements = <HTMLCollectionOf<HTMLElement>>(
            document.getElementsByClassName("perspective")
        );
        for (let i = 0; i < perspectiveElements.length; i++) {
            const elem = perspectiveElements[i];
            elem.style.transform = this.matrix3d;
            elem.style.transformOrigin = "0 0";
        }
    }

    addTriangulation(
        lines: { x1: number; y1: number; x2: number; y2: number }[],
        points: { x: number; y: number }[]
    ) {
        this.triangulation = {
            lines: lines.map(function (element) {
                return new Line(
                    new Point(element.x1, element.y1),
                    new Point(element.x2, element.y2)
                );
            }),
            points: points.map(function (element) {
                return new Point(element.x, element.y);
            }),
        };
        this.animation = new p5(this.animationSketch);
    }

    /**
     * Calculates and returns the perspective matrix for the given data.
     * @param begin A SrcPoints instantiation holding the four corner points.
     */
    perspectiveMatrix(
        begin: SrcPoints,
        extraScaleX: number,
        extraScaleY: number
    ) {
        const scaleMatrix = [extraScaleX, 0, 0, 0, extraScaleY, 0, 0, 0, 1];
        console.log(this.srcPoints);
        console.log(begin);
        let x0 = begin.LeftUp.x;
        let y0 = begin.LeftUp.y;
        let x1 = begin.RightUp.x;
        let y1 = begin.RightUp.y;
        let x2 = begin.RightUnder.x;
        let y2 = begin.RightUnder.y;
        let x3 = begin.LeftUnder.x;
        let y3 = begin.LeftUnder.y;
        let u0 = 0;
        let v0 = 0;
        let u1 = window.innerWidth;
        let v1 = 0;
        let u2 = window.innerWidth;
        let v2 = window.innerHeight;
        let u3 = 0;
        let v3 = window.innerHeight;
        let row1 = [x0, y0, 1, 0, 0, 0, -u0 * x0, -u0 * y0];
        let row2 = [0, 0, 0, x0, y0, 1, -v0 * x0, -v0 * y0];
        let row3 = [x1, y1, 1, 0, 0, 0, -u1 * x1, -u1 * y1];
        let row4 = [0, 0, 0, x1, y1, 1, -v1 * x1, -v1 * y1];
        let row5 = [x2, y2, 1, 0, 0, 0, -u2 * x2, -u2 * y2];
        let row6 = [0, 0, 0, x2, y2, 1, -v2 * x2, -v2 * y2];
        let row7 = [x3, y3, 1, 0, 0, 0, -u3 * x3, -u3 * y3];
        let row8 = [0, 0, 0, x3, y3, 1, -v3 * x3, -v3 * y3];

        let c = [u0, v0, u1, v1, u2, v2, u3, v3];

        let matrix = [row1, row2, row3, row4, row5, row6, row7, row8];

        let h: number[] = linSystem.solve(matrix, c);
        console.log(h);

        let matrix3d: string;

        if (h[0] != undefined) {
            h = [
                h[0] * scaleMatrix[0],
                h[1] * scaleMatrix[4],
                h[2],
                h[3] * scaleMatrix[0],
                h[4] * scaleMatrix[4],
                h[5],
                h[6] * scaleMatrix[0],
                h[7] * scaleMatrix[4],
                1,
            ];
        } else {
            console.log("POWER RANGERS");
            let angle = -Math.atan2(y1 - y0, x1 - x0);

            let sumX = x0 + x1 + x2 + x3;
            let sumY = y0 + y1 + y2 + y3;

            let transx = sumX / 4;
            let transy = sumY / 4;

            let dist1x = Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
            let dist2x = Math.sqrt(Math.pow(window.innerWidth, 2));

            let dist1y = Math.sqrt(Math.pow(x0 - x3, 2) + Math.pow(y0 - y3, 2));
            let dist2y = Math.sqrt(Math.pow(window.innerHeight, 2));

            let ratiox = dist2x / dist1x;
            let ratioy = dist2y / dist1y;

            let trx = -transx * ratiox;
            console.log(trx);
            let tryy = -transy * ratioy;
            console.log(tryy);

            console.log(angle);

            const s = [ratiox, 0, 0, 0, ratioy, 0, 0, 0, 1];
            const t1 = [1, 0, trx, 0, 1, tryy, 0, 0, 1];
            const r = [
                Math.cos(angle),
                -Math.sin(angle),
                0,
                Math.sin(angle),
                Math.cos(angle),
                0,
                0,
                0,
                1,
            ];
            const t2 = [
                1,
                0,
                window.innerWidth / 2,
                0,
                1,
                window.innerHeight / 2,
                0,
                0,
                1,
            ];

            h = matrixMultiplication3x3(t1, s);
            h = matrixMultiplication3x3(r, h);
            h = matrixMultiplication3x3(t2, h);
            h = matrixMultiplication3x3(h, scaleMatrix);
        }

        matrix3d =
            "matrix3d( " +
            h[0] +
            ", " +
            h[3] +
            ", " +
            0 +
            ", " +
            h[6] +
            ", " +
            h[1] +
            ", " +
            h[4] +
            ", " +
            0 +
            ", " +
            h[7] +
            ", " +
            0 +
            ", " +
            0 +
            ", " +
            1 +
            ", " +
            0 +
            ", " +
            h[2] +
            ", " +
            h[5] +
            ", " +
            0 +
            ", " +
            1 +
            " )";

        console.log(matrix3d);

        return matrix3d;
    }
}
