import { createCanvas } from "../screen_detection/screen_detection";
import Point from "../screen_detection/Point";
import delauney from "./Delaunay";

export default () => {
    const id = "triangulation-demo";
    const canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.id = id;
    const ctx = canvas.getContext("2d");
    const clickedPoints: Point[] = [];

    canvas.addEventListener("click", (e: MouseEvent) => {
        const boundingRect = canvas.getBoundingClientRect();
        const x = e.clientX - boundingRect.left;
        const y = e.clientY - boundingRect.top;
        clickedPoints.push(new Point(x, y));
        clickedPoints.sort((a, b) => {
            if (a.x - b.x == 0) {
                return a.y - b.y;
            } else {
                return a.x - b.x;
            }
        });
        const triangulation = delauney(clickedPoints).lines;
        triangulation.forEach(line => {
            let endPoints = line.endPoints;
            ctx.beginPath();
            ctx.moveTo(endPoints[0].x, endPoints[0].y);
            ctx.lineTo(endPoints[1].x, endPoints[1].y);
            ctx.stroke();
        });
        clickedPoints.forEach(point => {
            ctx.font = "50px Arial";
            ctx.fillText("*", point.x - 10, point.y + 25);
        });
    });

    return { canvas, id };
};
