import Point from "../image_processing/screen_detection/Point";

export interface IMasterVsRealPoints {
    LeftUp: {
        master: Point,
        real: Point
    },
    RightUp: {
        master: Point,
        real: Point
    },
    LeftUnder: {
        master: Point,
        real: Point
    },
    RightUnder: {
        master: Point,
        real: Point
    },
}

export interface IMasterVsRealPoint {
    master: Point,
    real: Point
};