import HtmlElem from "../../../HtmlElem";

export class CameraSlidersContainer extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraSlidersContainer");
  }
}
