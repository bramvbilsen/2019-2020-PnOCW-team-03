import { client } from "../../index";
import { createCanvas } from "./screen_detection/screen_detection";
import SlaveScreen from ".././util/SlaveScreen";
import {slaveFlowHandler} from '../../index';
import { PREFERRED_CANVAS_HEIGHT, PREFERRED_CANVAS_WIDTH } from "../CONSTANTS";
import {getScreensTranslatedToImage} from './Image Casting/sizeConverter';
import {BoundingBox, BoudingBoxOfSlaveScreens} from '../util/BoundingBox';
import {loadImage} from '../util/images';

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
    data:string;
    image: HTMLImageElement;
    slaveIDs: string[];
    step: imgDisplayFlow;
    slavesStartCanvas: HTMLCanvasElement;
    slaveScreens: SlaveScreen[] = [];

/**
    constructor(img: HTMLImageElement) {
        this.image = img;
        this.step = imgDisplayFlow.START;
    }*/
    constructor(screens:SlaveScreen[]) {
        this.slaveScreens = [...screens];
        this.step = imgDisplayFlow.START;
    }


    private initialize() {
        /*this.slaveIDs = client.slaves.length === 0 ? [] : [...client.slaves];
        this.currSlaveID = this.slaveIDs.pop();*/
        this.slaveScreens = [...slaveFlowHandler.screens];
        this.slavesStartCanvas = createCanvas(
            PREFERRED_CANVAS_WIDTH, PREFERRED_CANVAS_HEIGHT
        );
    }

    async defaultImage() {
        this.image = await loadImage(
            "http://localhost:3000/images/unicorn.jpeg");
    }

    linearScale() {
        this.initialize();
        //debugging
        this.slaveScreens.forEach(obj => {
            let bb = obj.boundingBox;
            console.log(imgDisplayFlow.LIN_SCALING + "\n slave = " + obj + "\n " +
                "Bbox: " + bb.topLeft + "\n" +
                bb.topRight + "\n" + bb.bottomLeft + "\n" + bb.bottomRight + "\n" +
                "screen itself:" + obj.corners)
        });

        this.slaveScreens = getScreensTranslatedToImage(this.image.width, this.image.height, this.slaveScreens);

        let scaleX = this.image.width / this.slavesStartCanvas.width;
        let scaleY = this.image.height / this.slavesStartCanvas.height;
        this.slavesStartCanvas.width *= scaleX;
        this.slavesStartCanvas.height *= scaleY;

        this.step = imgDisplayFlow.LIN_SCALING;
    }

    /**
     * 1)Get Context from blanco canvas in this class(used for placing the bbox contents in)
     * 2)Draw the boundingbox content from background to this blanco canvas
     * 3)From the drawn onto canvas, get all data in a url and place this in the slavescreen canvas src.
     */
    cutBoxOutImg() {
        this.step = imgDisplayFlow.CUT_IMG;

        this.slaveScreens.forEach(obj => {
            let bb = obj.boundingBox;
            //debugging
            console.log("slave = " + obj + "\n " +
                "Bbox: "+bb.topLeft +"\n" +
                bb.topRight+"\n" +bb.bottomLeft+"\n" +bb.bottomRight+"\n"+
                "screen itself:" + obj.corners
            );

            let ctxSlave = this.slavesStartCanvas.getContext('2d');
            ctxSlave.drawImage(this.image, bb.topLeft.x, bb.topLeft.y,
                bb.width, bb.height, 0, 0, bb.width, bb.height);
            let dataUrl = this.slavesStartCanvas.toDataURL();
            this.data = dataUrl;
            //obj.slavePortionImg.setAttribute('src', dataUrl);
            /**setting corners of slavescreen in relation of its bbox left upper corner in 0,0.*/
            //this.resetCoordinates(obj);

        });
        return this.data;
    }

    private resetCoordinates(slaveScreen: SlaveScreen) {
        let x = slaveScreen.boundingBox.topLeft.x;
        let y = slaveScreen.boundingBox.topLeft.y;
        slaveScreen.corners.forEach(corner => {
            corner.x -= x;
            corner.y -= y;
        });
    }
}
