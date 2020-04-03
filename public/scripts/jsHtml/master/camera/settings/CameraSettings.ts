import HtmlElem from "../../../HtmlElem";

export class CameraSettings extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraSettings");
  }
}
