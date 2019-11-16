import { client } from "../../index";
import findScreen, { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from "../util/SlaveScreen";
import {slaveFlowHandler} from '../../index';
import { PREFERRED_CANVAS_HEIGHT, PREFERRED_CANVAS_WIDTH } from "../CONSTANTS";
import {getScreensTranslatedToImage} from './Image Casting/sizeConverter';

export enum imgDisplayFlow {
    START = "initialize new canvas",
    LIN_SCALING = "scaling all slave coordinates to dim of cat cast img",
    CUT_IMG = "cutting out sections of images per slave",
    AFFINE_TRANSFORM = "transform cutted sections of img to rectangles per slave",
    STOP = "all slavescreens updated with img element"
}
/**
 * workflow:
 *  Create canvas with all original info -> linear scaling -> cut out rectangles from images -> process affine transform
 *  ation to rectangles to send to slaves.
 *
 */

export default class SlaveCatCastImgHandler {
    prevSlaveID: string;
    currSlaveID: string;
    slaveIDs: string[];
    step: imgDisplayFlow;
    slavesStartCanvas: HTMLCanvasElement;
    slaveScreens: SlaveScreen[] = [];


    constructor() {
        this.step = imgDisplayFlow.START;
    }

    private initialize(){
        //make button
        const initButton: JQuery<HTMLButtonElement> = $("#start");
        initButton.css("display", "none");
        this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        this.currSlaveID = this.slaveIDs.pop();
        this.slaveScreens = slaveFlowHandler.screens;
        this.slavesStartCanvas = createCanvas(
            PREFERRED_CANVAS_WIDTH,PREFERRED_CANVAS_HEIGHT
        );
    }

    /*
    *Yet to implement image choosing for cat casting
     */
    private linearScale(){
        this.slaveScreens = getScreensTranslatedToImage(img.width,img.height, this.slaveScreens);
    }
    private cutBoundingBox(){
        this.slaveScreens.forEach(obj=>{

        });
    }
}
