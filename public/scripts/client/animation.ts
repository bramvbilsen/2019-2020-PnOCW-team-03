import Point from "../image_processing/screen_detection/Point";
import delauney from "../image_processing/Triangulation/Delaunay";
import Line from "../image_processing/screen_detection/Line";
import { createCanvas } from "../image_processing/screen_detection/screen_detection";
import Triangulation from "../image_processing/Triangulation/Triangulation";
import SlaveScreen from "../util/SlaveScreen";

const {
    checkIntersection,
    colinearPointWithinSegment,
} = require("line-intersect");

export default function testu() {
    let slaves: SlaveScreen[] = [];
    let corners1 = [
        new Point(10, 20),
        new Point(40, 20),
        new Point(10, 10),
        new Point(40, 10),
    ];
    let corners2 = [
        new Point(60, 60),
        new Point(90, 60),
        new Point(60, 40),
        new Point(90, 40),
    ];
    let corners3 = [
        new Point(10, 50),
        new Point(40, 50),
        new Point(10, 80),
        new Point(40, 80),
    ];
    let corners4 = [
        new Point(10, 10),
        new Point(14, 10),
        new Point(10, 8),
        new Point(14, 8),
    ];
    slaves.push(new SlaveScreen(corners1, "1"));
    slaves.push(new SlaveScreen(corners2, "2"));
    //slaves.push(new SlaveScreen(corners3, "3"));
    //slaves.push(new SlaveScreen(corners4, "4"));

    let triangulation = calculateTriangulation(slaves);
    console.log(triangulation);
    console.log(slaves);

    // shit tekenen
    // const canvas = createCanvas(200, 200);
    // const ctx = canvas.getContext("2d");
    // ctx.scale(5, 5);
    // ctx.strokeStyle = "rgb(255,0,0)";
    // triangulation.lines.forEach((line: Line) => {
    //     let endPoints = line.endPoints;
    //     ctx.beginPath();
    //     ctx.moveTo(endPoints[0].x, endPoints[0].y);
    //     ctx.lineTo(endPoints[1].x, endPoints[1].y);
    //     ctx.stroke();
    // });
    showAnimationOnSlaves(slaves);
}

//deze functie werkt normaal
function calculateTriangulation(slaves: SlaveScreen[]) {
    let middlePoints: Point[] = [];
    slaves.forEach(slave => {
        let centroid = slave.centroid;
        middlePoints.push(centroid);
    });
    middlePoints.sort(function(a, b) {
        if (a.x - b.x == 0) {
            return a.y - b.y;
        } else {
            return a.x - b.x;
        }
    });
    let triangulation = delauney(middlePoints);

    //extra info initialiseren om tekenen/animatie mogelijk te maken
    triangulation.lines.forEach(line => {
        //voor elke lijn hetzelfde doen
        let slaveWithLine: {
            [key: string]: Array<Point>; //string is slaveID
        } = {};
        let orientationslave: {
            [key: string]: string; //string is slave, othet string is orientation
        } = {};
        for (let i = 0; i < slaves.length; i++) {
            const slave = slaves[i];
            const slaveId = slave.slaveID;
            let orientatedPoints: {
                [key: string]: Point; //string is which line the screen cuts
            } = findIntersections(line, slave);
            let points: Point[] = Object.values(orientatedPoints);
            if (points.length > 0) {
                slaveWithLine[slaveId] = points; //enkel toevoegen als er effectief snijpunten zijn, points zijn de snijlijnen
                if (points.length == 1) {
                    addAngle(slave, points, orientatedPoints);
                    orientationslave[slaveId] = Object.keys(
                        orientatedPoints
                    ).find(key => orientatedPoints[key] === points[0]);
                } else {
                    points.sort(function(a, b) {
                        //points van links naar reecht(als gelijk van boven naar onder)
                        if (a.x - b.x == 0) {
                            return a.y - b.y;
                        } else {
                            return a.x - b.x;
                        }
                    });
                    let fullstring = "";
                    for (let i = 0; i < points.length; i++) {
                        const element = points[i];
                        fullstring.concat(
                            Object.keys(orientatedPoints).find(
                                key => orientatedPoints[key] === points[i]
                            )
                        );
                    }
                    addLine(slave, points, orientatedPoints);
                    orientationslave[slaveId] = fullstring;
                }
            }
        }
        let points: Array<Point[]> = Object.values(slaveWithLine);
        //sorteren van links naar rechts
        points.sort(function(a, b) {
            if (a[0].x - b[0].x == 0) {
                return a[0].y - b[0].y;
            } else {
                return a[0].x - b[0].x;
            }
        });
        let slaveIDs: Array<{
            slaveId: string;
            points: Point[];
            orient: string;
        }> = [];
        points.forEach(points => {
            let slave = Object.keys(slaveWithLine).find(
                key => slaveWithLine[key] === points
            );
            let orient: string = orientationslave[slave];
            slaveIDs.push({ slaveId: slave, points, orient });
        });
        triangulation.addSlaves(line, slaveIDs);
    });
    triangulation.linkMiddlePointsToLines();
    return triangulation;

    function findIntersections(line: Line, slave: SlaveScreen) {
        const endPoints = line.endPoints;
        const corners = slave.sortedCorners;
        const leftUp = corners.LeftUp;
        const rightUp = corners.RightUp;
        const leftUnder = corners.LeftUnder;
        const rightUnder = corners.RightUnder;
        let cuttingPoints: {
            [key: string]: Point;
        } = {};

        let Up = checkIntersection(
            leftUp.x,
            leftUp.y,
            rightUp.x,
            rightUp.y,
            endPoints[0].x,
            endPoints[0].y,
            endPoints[1].x,
            endPoints[1].y
        );
        if (Up.type == "intersecting") {
            cuttingPoints["u"] = new Point(Up.point.x, Up.point.y);
        }
        let Right = checkIntersection(
            rightUnder.x,
            rightUnder.y,
            rightUp.x,
            rightUp.y,
            endPoints[0].x,
            endPoints[0].y,
            endPoints[1].x,
            endPoints[1].y
        );
        if (Right.type == "intersecting") {
            cuttingPoints["r"] = new Point(Right.point.x, Right.point.y);
        }
        let Left = checkIntersection(
            leftUp.x,
            leftUp.y,
            leftUnder.x,
            leftUnder.y,
            endPoints[0].x,
            endPoints[0].y,
            endPoints[1].x,
            endPoints[1].y
        );
        if (Left.type == "intersecting") {
            cuttingPoints["l"] = new Point(Left.point.x, Left.point.y);
        }
        let Under = checkIntersection(
            rightUnder.x,
            rightUnder.y,
            leftUnder.x,
            leftUnder.y,
            endPoints[0].x,
            endPoints[0].y,
            endPoints[1].x,
            endPoints[1].y
        );
        if (Under.type == "intersecting") {
            cuttingPoints["d"] = new Point(Under.point.x, Under.point.y);
        }
        return cuttingPoints;
    }

    function addAngle(
        slave: SlaveScreen,
        points: Point[],
        orientation: { [key: string]: Point }
    ) {
        let string = Object.keys(orientation).find(
            key => orientation[key] === points[0]
        );

        slave.triangulation.angles.push({ string, point: points[0] });
    }

    function addLine(
        slave: SlaveScreen,
        points: Point[],
        orientation: { [key: string]: Point }
    ) {
        let fullString = "";
        for (let i = 0; i < points.length; i++) {
            let string = Object.keys(orientation).find(
                key => orientation[key] === points[i]
            );
            console.log(string);
            fullString = fullString.concat(string);
        }
        slave.triangulation.lines.push({
            string: fullString,
            point1: points[0],
            point2: points[1],
        });
    }
}

function showAnimationOnSlaves(slaves: SlaveScreen[]) {
    //ook eerst naar slaves juiste lijnen emitten -> nog doen
    let triangulation: Triangulation = calculateTriangulation(slaves);
    let points = triangulation.points;
    let currentPoint = points[Math.floor(Math.random() * points.length)];
    const self = this;
    nextLine(currentPoint, new Date().getTime() + 10000); //een beetje tijd voor er gestart wordt

    function nextLine(nextPoint: Point, startTime: number) {
        let lines = triangulation.middlePoints;
        let slavesLinkedWithLine = triangulation.slaves;
        let potentialLines = lines.find(obj => {
            return obj.point === currentPoint;
        }).lines;
        let currentLine = //random lijn kiezen om naar toe te gaan
            potentialLines[Math.floor(Math.random() * potentialLines.length)];
        let slavesIdWithCurrentLine = slavesLinkedWithLine.find(obj => {
            return obj.line === currentLine;
        }).slaves; //is nog een object dat de Id bevat
        //lijst met overeenkomstige slaves maken
        let slavesWithCurrentLine: SlaveScreen[] = [];
        slavesIdWithCurrentLine.forEach(slaveId => {
            slavesWithCurrentLine.push(
                slaves.find(function(element) {
                    return element.slaveID == slaveId.slaveId;
                })
            );
        });
        let reverse = false;
        if (
            !(
                slavesWithCurrentLine[0].centroid.x == nextPoint.x &&
                slavesWithCurrentLine[0].centroid.y == nextPoint.y
            )
        ) {
            slavesWithCurrentLine.reverse();
            reverse = true;
        }
        console.log(slavesWithCurrentLine);
        for (let i = 0; i < slavesWithCurrentLine.length; i++) {
            const element = slavesWithCurrentLine[i];
            const slaveID = element.slaveID;
            console.log("=====");
            console.log(slaveID);
            //dingen die moeten getekent worden
            let angles = element.triangulation.angles;
            let lines = element.triangulation.lines;
            //omvormen naar ratio
            let ratioAngles: Array<{
                string: string;
                point: number;
            }> = ratioAngle(element, angles);
            let ratioLines: Array<{
                string: string;
                point1: number;
                point2: number;
            }> = ratioLine(element, lines);
            //de animatielijn
            let animation = slavesIdWithCurrentLine.find(obj => {
                return obj.slaveId === slaveID;
            });
            console.log(animation);
            let animationLine = animation.points; //de orientatiestring zit hier niet meer bij
            let animationOrient = animation.orient;
            if (animationLine.length == 1) {
                animationLine.unshift(null); //null gaat overeenkomen met middelpunt
                animationOrient = "n".concat(animationOrient);
            }

            if (i != 0 && !animationLine[0]) {
                animationLine.reverse(); //hier hebben we de juiste volgorde
                animationOrient = animationOrient
                    .split("")
                    .reverse()
                    .join("");
            }
            console.log(animationLine);
            console.log(animationOrient);
            //animatielijn omvormen naar ratio
            let ratioAnimationLine: {
                string: string;
                point1: number;
                point2: number;
            } = ratioLine(element, [
                {
                    string: animationOrient,
                    point1: animationLine[0],
                    point2: animationLine[1],
                },
            ])[0];
            //snelhied
            let speed = 5;
            //starttijd berekenen
            let startPoint: Point;
            if (animationLine[0] == null) {
                startPoint = element.centroid;
            } else {
                startPoint = animationLine[0];
            }
            let start =
                startTime +
                (Math.sqrt(
                    Math.pow(startPoint.x - nextPoint.x, 2) +
                        Math.pow(startPoint.y - nextPoint.y, 2)
                ) /
                    speed) *
                    1000;
            console.log(new Date(start));
            //duration berekenen
            let endPoint: Point;
            if (animationLine[1] == null) {
                endPoint = element.centroid;
            } else {
                endPoint = animationLine[1];
            }
            let duration =
                (Math.sqrt(
                    Math.pow(endPoint.x - startPoint.x, 2) +
                        Math.pow(endPoint.y - startPoint.y, 2)
                ) /
                    speed) *
                1000;
            //emit voor elke slave
            console.log(duration);
            showAnimation(
                start,
                slaveID,
                ratioAnimationLine,
                ratioAngles,
                ratioLines,
                duration
            );
        }
        //nieuwe punt + nieuwe starttijd en dan terug deze functie oproepen
        //new point
        let newPoint: Point;
        if (
            currentLine.endPoints[0].x == nextPoint.x &&
            currentLine.endPoints[0].y == nextPoint.y
        ) {
            newPoint = currentLine.endPoints[1];
        } else {
            newPoint = currentLine.endPoints[0];
        }

        //nieuwe starttijd
        let newStartTime: number =
            Math.sqrt(
                Math.pow(nextPoint.x - newPoint.x, 2) +
                    Math.pow(nextPoint.y - newPoint.y, 2)
            ) /
                5 +
            startTime;
        // setTimeout(
        //     () => nextLine(newPoint, newStartTime),
        //     (newStartTime - startTime) / 2
        // );
    }

    //juiste info doorsturen + nog een appart voor de animatielijn de juiste orientatie te vinden
    function ratioAngle(
        slave: SlaveScreen,
        points: Array<{ string: string; point: Point }>
    ) {
        let ratio: Array<{ string: string; point: number }> = [];
        const corners = slave.sortedCorners;
        points.forEach(element => {
            const string = element.string;
            let distance: number;
            let distancePoint: number; //links -> rechts, boven -> onder
            if (string == "u") {
                distance = Math.sqrt(
                    Math.pow(corners.LeftUp.x - corners.RightUp.x, 2) +
                        Math.pow(corners.LeftUp.y - corners.RightUp.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.LeftUp.x, 2) +
                        Math.pow(element.point.y - corners.LeftUp.y, 2)
                );
            } else if (string == "l") {
                distance = Math.sqrt(
                    Math.pow(corners.LeftUp.x - corners.LeftUnder.x, 2) +
                        Math.pow(corners.LeftUp.y - corners.LeftUnder.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.LeftUp.x, 2) +
                        Math.pow(element.point.y - corners.LeftUp.y, 2)
                );
            } else if (string == "r") {
                distance = Math.sqrt(
                    Math.pow(corners.RightUnder.x - corners.RightUp.x, 2) +
                        Math.pow(corners.RightUnder.y - corners.RightUp.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.RightUp.x, 2) +
                        Math.pow(element.point.y - corners.RightUp.y, 2)
                );
            } else {
                distance = Math.sqrt(
                    Math.pow(corners.RightUnder.x - corners.LeftUnder.x, 2) +
                        Math.pow(corners.RightUnder.y - corners.LeftUnder.y, 2)
                );
                distancePoint = Math.sqrt(
                    Math.pow(element.point.x - corners.LeftUnder.x, 2) +
                        Math.pow(element.point.y - corners.LeftUnder.y, 2)
                );
            }
            let ratioNumber = distancePoint / distance;
            ratio.push({ string: element.string, point: ratioNumber });
        });
        return ratio;
    }
    function ratioLine(
        slave: SlaveScreen,
        points: Array<{ string: string; point1: Point; point2: Point }>
    ) {
        let ratio: Array<{
            string: string;
            point1: number;
            point2: number;
        }> = [];
        const corners = slave.sortedCorners;
        points.forEach(element => {
            const fullString = element.string.split("");
            const points = [element.point1, element.point2];
            let ratioNumber: number[] = [];
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (point) {
                    const string = fullString[i];
                    let distance: number;
                    let distancePoint: number; //links -> rechts, boven -> onder
                    if (string == "u") {
                        distance = Math.sqrt(
                            Math.pow(corners.LeftUp.x - corners.RightUp.x, 2) +
                                Math.pow(
                                    corners.LeftUp.y - corners.RightUp.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.LeftUp.x, 2) +
                                Math.pow(point.y - corners.LeftUp.y, 2)
                        );
                    } else if (string == "l") {
                        distance = Math.sqrt(
                            Math.pow(
                                corners.LeftUp.x - corners.LeftUnder.x,
                                2
                            ) +
                                Math.pow(
                                    corners.LeftUp.y - corners.LeftUnder.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.LeftUp.x, 2) +
                                Math.pow(point.y - corners.LeftUp.y, 2)
                        );
                    } else if (string == "r") {
                        distance = Math.sqrt(
                            Math.pow(
                                corners.RightUnder.x - corners.RightUp.x,
                                2
                            ) +
                                Math.pow(
                                    corners.RightUnder.y - corners.RightUp.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.RightUp.x, 2) +
                                Math.pow(point.y - corners.RightUp.y, 2)
                        );
                    } else {
                        distance = Math.sqrt(
                            Math.pow(
                                corners.RightUnder.x - corners.LeftUnder.x,
                                2
                            ) +
                                Math.pow(
                                    corners.RightUnder.y - corners.LeftUnder.y,
                                    2
                                )
                        );
                        distancePoint = Math.sqrt(
                            Math.pow(point.x - corners.LeftUnder.x, 2) +
                                Math.pow(point.y - corners.LeftUnder.y, 2)
                        );
                    }
                    ratioNumber.push(distancePoint / distance);
                } else {
                    ratioNumber.push(null);
                }
            }
            ratio.push({
                string: element.string,
                point1: ratioNumber[0],
                point2: ratioNumber[1],
            });
        });
        return ratio;
    }
}

function showAnimation(
    startTime: number,
    slaveId: string,
    animationLine: { string: string; point1: number; point2: number },
    angles: Array<{ string: string; point: number }>,
    lines: Array<{ string: string; point1: number; point2: number }>,
    duration: number
) {
    //$("#loading").css("display", "inherit");
    //eerst de verhoudingen omzetten naar punten -> null wordt center
    let slaveAnimationLine: Point[] = ratioToPointsLine([animationLine])[0]; //-> volgorde is de doorloopszin
    let slaveAngles: Array<Point> = ratioToPointsAngle(angles);
    let slaveLines: Array<Point[]> = ratioToPointsLine(lines);
    //slavaAnimation omzetten naar een aangrijpingspunt met richting en deltax
    let directionx = slaveAnimationLine[1].x - slaveAnimationLine[0].x;
    let directiony = slaveAnimationLine[1].y - slaveAnimationLine[0].y;

    let length_direction = Math.sqrt(
        Math.pow(directionx, 2) + Math.pow(directiony, 2)
    );
    directionx /= duration;
    directiony /= duration;
    console.log(directionx);
    console.log(directiony);
    let startPoint = slaveAnimationLine[0];
    //wachten tot de animatie start
    //startTime += this.serverTimeDiff; //syncen
    const eta_ms = startTime - Date.now();
    setTimeout(function() {
        console.log(slaveLines);
        console.log(slaveAngles);
        console.log(slaveAnimationLine);
        const enddate = new Date(startTime + duration);
        animation(
            enddate.getTime(),
            startPoint,
            directionx,
            directiony,
            slaveAngles,
            slaveLines
        );
    }, eta_ms);

    //verhoudingen naar juiste punten omzetten
    function ratioToPointsAngle(
        angles: Array<{ string: string; point: number }>
    ) {
        let points: Point[] = [];
        angles.forEach(angle => {
            let string = angle.string;
            let ratio = angle.point;
            if (string == "u") {
                let x = ratio * window.innerWidth;
                let y = 0;
                points.push(new Point(x, y));
            } else if (string == "l") {
                let x = 0;
                let y = ratio * window.innerHeight;
                points.push(new Point(x, y));
            } else if (string == "r") {
                let x = window.innerWidth;
                let y = ratio * window.innerHeight;
                points.push(new Point(x, y));
            } else {
                let x = ratio * window.innerWidth;
                let y = window.innerHeight;
                points.push(new Point(x, y));
            }
        });
        return points;
    }

    function ratioToPointsLine(
        angles: Array<{ string: string; point1: number; point2: number }>
    ) {
        let points: Array<Point[]> = [];
        angles.forEach(angle => {
            let fullstring = angle.string;
            let ratio = [angle.point1, angle.point2];
            let line: Point[] = [];
            for (let i = 0; i < ratio.length; i++) {
                const element = ratio[i];
                if (element) {
                    const string = fullstring[i];
                    if (string == "u") {
                        let x = element * window.innerWidth;
                        let y = 0;
                        line.push(new Point(x, y));
                    } else if (string == "l") {
                        let x = 0;
                        let y = element * window.innerHeight;
                        line.push(new Point(x, y));
                    } else if (string == "r") {
                        let x = window.innerWidth;
                        let y = element * window.innerHeight;
                        line.push(new Point(x, y));
                    } else {
                        let x = element * window.innerWidth;
                        let y = window.innerHeight;
                        line.push(new Point(x, y));
                    }
                } else {
                    line.push(
                        new Point(window.innerWidth / 2, window.innerHeight / 2)
                    );
                }
            }
            points.push(line);
        });
        return points;
    }

    //de animatie zelf
    function animation(
        endDate: number,
        startPoint: Point,
        directionx: number, //per milliseconde
        directiony: number,
        slaveAngles: Array<Point>,
        slaveLines: Array<Point[]>
    ) {
        let x: number = startPoint.x;
        let y: number = startPoint.y;
        var timer = setInterval(function() {
            const canvas = createCanvas(window.innerWidth, window.innerHeight);
            const ctx = canvas.getContext("2d");
            const now = new Date().getTime();
            const t = Math.floor(((endDate - now) % (1000 * 60)) / 1000);
            ctx.strokeStyle = "rgb(255,0,0)";
            //lijnen tekenen met middelpunten
            slaveAngles.forEach(angle => {
                ctx.beginPath();
                ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2);
                ctx.lineTo(angle.x, angle.y);
                ctx.stroke();
            });
            //anderelijnen tekenen
            slaveLines.forEach(line => {
                ctx.beginPath();
                ctx.moveTo(line[0].x, line[1].y);
                ctx.lineTo(line[1].x, line[1].y);
                ctx.stroke();
            });

            //ster in het midden tekenen
            ctx.font = "50px Arial";
            ctx.fillText(
                "*",
                window.innerWidth / 2 - 10,
                window.innerHeight / 2 + 25
            );
            if (t > 0) {
                //circel tekenen
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, 2 * Math.PI);
                ctx.stroke();
                x += directionx;
                y += directiony;
                $("#result-img-container").append(canvas);
            } else {
                //nu geen cirkel meer tekenenen
                $("#result-img-container").append(canvas);
                clearinterval();
            }
        }, 1);
        function clearinterval() {
            clearInterval(timer);
        }
    }
}
