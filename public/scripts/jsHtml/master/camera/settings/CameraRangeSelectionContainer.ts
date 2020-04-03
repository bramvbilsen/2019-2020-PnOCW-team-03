import HtmlElem from "../../../HtmlElem";

export class CameraRangeSelectionContainer extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraRangeSelectionContainer");
  }
}
