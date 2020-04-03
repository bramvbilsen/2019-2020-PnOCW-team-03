import HtmlElem from "../../HtmlElem";

export class ConfirmScreensButton extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#confirmButton");
  }
}

export class CameraSettingsOpenButton extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#settingsButton");
  }
}
