import HtmlElem from "../../../HtmlElem";

export class CameraSettingsCloseButon extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraSettingsCloseButton");
  }
}
