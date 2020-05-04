import HtmlElem from "./HtmlElem";

abstract class CanvasOverlay extends HtmlElem {
    abstract get elem(): HTMLCanvasElement;

    set width(width: number) {
        this.elem.width = width;
    }

    set height(height: number) {
        this.elem.height = height;
    }

    get width() {
        return this.elem.width;
    }
    get height() {
        return this.elem.height;
    }

    clear() {
        const elem = this.elem;
        elem.getContext("2d").clearRect(0, 0, elem.width, elem.height);
    }
}

export class CameraOverlay extends CanvasOverlay {
    get elem(): HTMLCanvasElement {
        return document.querySelector("#cameraOverlay");
    }
}
