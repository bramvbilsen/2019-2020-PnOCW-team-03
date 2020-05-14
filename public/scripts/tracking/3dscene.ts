import Point from "../image_processing/screen_detection/Point";
import { CameraOverlay } from "../UI/Master/cameraOverlays";

export class Cube {
    //een cube vanuit frontaal zicht
    CUBE_VERTICES = [
        [-1, -1, -1],
        [1, -1, -1],
        [-1, 1, -1],
        [1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [-1, 1, 1],
        [1, 1, 1],
    ];
    CUBE_LINES = [
        [0, 1],
        [1, 3],
        [3, 2],
        [2, 0],
        [2, 6],
        [3, 7],
        [0, 4],
        [1, 5],
        [6, 7],
        [6, 4],
        [7, 5],
        [4, 5],
    ];

    middle: Point;

    constructor(middle: Point, size: number) {
        //hier aanpassen van waar de cube moet worden getekened
        const overlay = new CameraOverlay();
        const width = overlay.width;
        const height = overlay.height;
        this.middle = new Point(width / 2, height / 2);
        const scale = width / 8;
        for (let i = 0; i < this.CUBE_VERTICES.length; i++) {
            this.CUBE_VERTICES[i][0] =
                this.CUBE_VERTICES[i][0] * scale + this.middle.x;
            this.CUBE_VERTICES[i][1] =
                this.CUBE_VERTICES[i][1] * scale + this.middle.y;
            this.CUBE_VERTICES[i][2] = this.CUBE_VERTICES[i][2] * scale;
        }
        //this.rotateAroundy(30);
        console.log("CUBE GEMAAKT");
        console.log(this.CUBE_VERTICES);
    }

    rotateAroundy(angle: number) {
        const radians = angle * (Math.PI / 180);
        for (let i = 0; i < this.CUBE_VERTICES.length; i++) {
            let x = this.CUBE_VERTICES[i][0];
            let z = this.CUBE_VERTICES[i][2];

            this.CUBE_VERTICES[i][0] =
                Math.cos(radians) * x + Math.sin(radians) * z;
            this.CUBE_VERTICES[i][2] =
                -Math.sin(radians) * x + Math.cos(radians) * z;
        }
    }

    PERSPECTIVE = 500;

    project(point: number[], matrix?: number[]) {
        let cameraX = this.middle.x;
        let cameraY = this.middle.y;
        if (matrix) {
            const div = matrix[6] * cameraX + matrix[7] * cameraY + 1;
            console.log("K: " + div);
            cameraX =
                (matrix[0] * cameraX + matrix[1] * cameraY + matrix[2] * 1) /
                div;
            cameraY =
                (matrix[3] * cameraX + matrix[4] * cameraY + matrix[5] * 1) /
                div;
        }
        let scaleProjected = (-this.PERSPECTIVE + point[2]) / this.PERSPECTIVE;
        // The xProjected is the x position on the 2D world
        let xProjected = (point[0] - cameraX) * scaleProjected + cameraX;
        // The yProjected is the y position on the 2D world
        let yProjected = (point[1] - cameraY) * scaleProjected + cameraY;
        return [xProjected, yProjected];
    }
}
