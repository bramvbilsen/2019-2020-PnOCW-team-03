import Point from "../image_processing/screen_detection/Point";
import { BoundingBox } from "./BoundingBox";
import Line from "../image_processing/screen_detection/Line";
import { radiansToDegrees, rotatePointAroundAnchor } from "./angles";
import { sortCorners } from "./shapes";
import { IMasterVsRealPoints, CornerLabels, IMasterVsRealPoint } from "../types/Points";

export default class SlaveScreen {
    corners: Point[];
    slaveID: string;
    angle: number | undefined;
    slavePortionImg: HTMLCanvasElement;
    masterVsRealCorners: IMasterVsRealPoints;
    triangulation: {
        //de lijnen die zeker moeten getekend worden
        angles: Array<{ string: string; point: Point }>;
        lines: Array<{ string: string; point1: Point; point2: Point }>;
    } = {
            angles: [],
            lines: [],
        };

    constructor(corners: Point[], slaveID: string) {
        this.corners = corners;
        this.slaveID = slaveID;
    }

    get centroid(): Point {
        let sumX = 0;
        let sumY = 0;
        this.corners.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        });
        return new Point(
            Math.round(sumX / this.corners.length),
            Math.round(sumY / this.corners.length)
        );
    }

    get boundingBox() {
        return new BoundingBox(this.corners);
    }

    get width(): number {
        return this.widthEdge.length;
    }

    get height(): number {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        const width = Math.max(
            edgeA.length,
            edgeB.length,
            edgeC.length,
            edgeD.length
        );
        if (width === edgeA.length || width === edgeC.length) {
            return Math.max(edgeB.length, edgeD.length);
        } else {
            return Math.max(edgeA.length, edgeC.length);
        }
    }

    // TODO: This should be fixed because it won't work for portrait oriented devices.
    /**
     * Edge representing the width of the screen
     */
    get widthEdge(): Line {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        const longestLength = Math.max(
            edgeA.length,
            edgeB.length,
            edgeC.length,
            edgeD.length
        );
        if (edgeA.length === longestLength) return edgeA;
        if (edgeB.length === longestLength) return edgeB;
        if (edgeC.length === longestLength) return edgeC;
        if (edgeD.length === longestLength) return edgeD;
    }

    // TODO: This should be fixed because it won't work for portrait oriented devices.
    /**
     * Edge representing the height of the screen
     */
    get heightEdge(): Line {
        this.sortCornersByAngle();
        const edgeA = new Line(this.corners[0], this.corners[1]);
        const edgeB = new Line(this.corners[1], this.corners[2]);
        const edgeC = new Line(this.corners[2], this.corners[3]);
        const edgeD = new Line(this.corners[3], this.corners[0]);
        const width = Math.max(
            edgeA.length,
            edgeB.length,
            edgeC.length,
            edgeD.length
        );
        if (width === edgeA.length || width === edgeC.length) {
            const longestLength = Math.max(edgeB.length, edgeD.length);
            if (longestLength === edgeB.length) return edgeB;
            if (longestLength === edgeD.length) return edgeD;
        } else {
            const longestLength = Math.max(edgeA.length, edgeC.length);
            if (longestLength === edgeA.length) return edgeA;
            if (longestLength === edgeC.length) return edgeC;
        }
    }

    get topLeftCorner(): Point {
        const corners = [...this.corners];
        corners.sort((a, b) => a.y - b.y);
        if (corners[0].x < corners[1].x) {
            return corners[0];
        } else {
            return corners[1];
        }
    }

    get sortedCorners(): {
        LeftUp: Point;
        RightUp: Point;
        RightUnder: Point;
        LeftUnder: Point;
    } {
        return sortCorners(this.corners);
    }

    public sortCornersByAngle() {
        const center = this.centroid;
        // Sorting by https://math.stackexchange.com/questions/978642/how-to-sort-vertices-of-a-polygon-in-counter-clockwise-order
        this.corners.sort((a, b) => {
            const a1 =
                (radiansToDegrees(Math.atan2(a.x - center.x, a.y - center.y)) +
                    360) %
                360;
            const a2 =
                (radiansToDegrees(Math.atan2(b.x - center.x, b.y - center.y)) +
                    360) %
                360;
            return a1 - a2;
        });
    }

    /**
     * Should only be called after `this.masterVsRealCorners` is assigned.
     * @param corner 
     */
    public mapMasterToRealCornerLabel(corner: CornerLabels): CornerLabels {

        function stringToLabel(label: string): CornerLabels {
            if (label === "LeftUp") {
                return CornerLabels.LeftUp;
            } else if (label === "RightUp") {
                return CornerLabels.RightUp;
            } else if (label === "LeftUnder") {
                return CornerLabels.LeftUnder;
            } else {
                return CornerLabels.RightUnder;
            }
        }

        let masterPoint: Point;

        switch (corner) {
            case CornerLabels.LeftUp:
                masterPoint = this.masterVsRealCorners.LeftUp.master;
                for (let [label, points] of Object.entries(this.masterVsRealCorners)) {
                    if (masterPoint.equals((<IMasterVsRealPoint>points).real)) {
                        return stringToLabel(label);
                    }
                }
                break;
            case CornerLabels.RightUp:
                masterPoint = this.masterVsRealCorners.RightUp.master;
                for (let [label, points] of Object.entries(this.masterVsRealCorners)) {
                    if (masterPoint.equals((<IMasterVsRealPoint>points).real)) {
                        return stringToLabel(label);
                    }
                }
                break;
            case CornerLabels.RightUnder:
                masterPoint = this.masterVsRealCorners.RightUnder.master;
                for (let [label, points] of Object.entries(this.masterVsRealCorners)) {
                    if (masterPoint.equals((<IMasterVsRealPoint>points).real)) {
                        return stringToLabel(label);
                    }
                }
                break;
            case CornerLabels.LeftUnder:
                masterPoint = this.masterVsRealCorners.LeftUnder.master;
                for (let [label, points] of Object.entries(this.masterVsRealCorners)) {
                    if (masterPoint.equals((<IMasterVsRealPoint>points).real)) {
                        return stringToLabel(label);
                    }
                }
                break;
            default:
                return;
        }
    }

    public copy(): SlaveScreen {
        const screen = new SlaveScreen(this.corners.map(corner => corner.copy()), this.slaveID);
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }

    public copyRotated(deg: number): SlaveScreen {
        const screen = new SlaveScreen(this.corners.map(corner => rotatePointAroundAnchor(corner.copy(), this.centroid, deg)), this.slaveID);
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }

    public copyTranslated(dx: number, dy: number): SlaveScreen {
        const screen = new SlaveScreen(this.corners.map(corner => corner.copyTranslated(dx, dy)), this.slaveID);
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }

    /**
     * Copies the screen and moves it as close as possible to (0, 0) while keeping all coordinates positive.
     */
    public copyAndMoveAsCloseToOriginAsPossible(): SlaveScreen {
        const corners = [...this.corners];
        const moveY = corners.sort((a, b) => a.y - b.y)[0].y;
        const moveX = corners.sort((a, b) => a.x - b.x)[0].x;
        corners.forEach(corner => {
            corner.x -= moveX;
            corner.y -= moveY;
        });

        const screen = new SlaveScreen(corners, this.slaveID);
        screen.slavePortionImg = this.slavePortionImg;
        return screen;
    }
}
