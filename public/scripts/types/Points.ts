import Point from "../image_processing/screen_detection/Point";

export enum CornerLabels {
    LeftUp = "Left up",
    RightUp = "Right up",
    LeftUnder = "Left under",
    RightUnder = "Right under",
}

export interface IActualCorners {
    LeftUp: Point
    RightUp: Point
    LeftUnder: Point
    RightUnder: Point
}

export interface IMasterVsActualPoint {
    master: Point,
    actual: Point
};