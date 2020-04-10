import Line from "../image_processing/screen_detection/Line";
import MiddlePoint from "../image_processing/Triangulation/MiddlePoint";
import Point from "../image_processing/screen_detection/Point";
import p5 from "p5";
import { client } from "../../index";

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
    boundingBoxWidth: number;
    boundingBoxHeight: number;
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
    p5Canvas: p5.Renderer;
    distancePerFrame = 0.5;

    constructor() {
        //this.animating = false;
        //p5 initialiseren
        this.animation = new p5(this.animationSketch);
        this.p5Canvas = this.animation.createCanvas(
            this.boundingBoxWidth,
            this.boundingBoxHeight
        );
    }

    animate(startTime: number, newPosition: Point, newUnitVector: Point) {
        client.moveToForeground("animation");
        const eta_ms = startTime - Date.now();
        setTimeout(() => {
            this.animation.noLoop();
            this.positionBall = newPosition;
            this.eenheidsVector = newUnitVector;
            this.animation.loop();
        }, eta_ms);
    }

    public animationSketch = (p: p5) => {
        p.setup = () => {
            const fps = 40;
            p.frameRate(fps);
            this.p5Canvas.id("animation");
            const htmlcanvas = document.getElementById("animation");
            htmlcanvas.style.transform = this.matrix3d;
            htmlcanvas.style.transformOrigin = "0 0";
            p.noLoop();
        };

        p.draw = () => {
            p.clear();
            const dx = this.distancePerFrame * this.eenheidsVector.x;
            const dy = this.distancePerFrame * this.eenheidsVector.y;
            this.positionBall = new Point(
                this.positionBall.x + dx,
                this.positionBall.y + dy
            );
            drawBall();
        };

        function drawBall() {
            p.stroke(0, 0, 0, 0);
            p.fill("blue");
            p.ellipse(this.positionBall.x, this.positionBall.y, 100, 100);
        }
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
        this.boundingBoxHeight = boundingBoxHeight;
        this.boundingBoxWidth = boundingBoxWidth;
        this.matrix3d = this.perspectiveMatrix(begin);
        this.srcPoints = begin;
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
    }

    /**
     * Calculates and returns the perspective matrix for the given data.
     * @param begin A SrcPoints instantiation holding the four corner points.
     */
    perspectiveMatrix(begin: SrcPoints) {
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
        let matrix3d =
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
