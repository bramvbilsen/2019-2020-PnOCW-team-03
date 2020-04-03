import HtmlElem from "../../../HtmlElem";

export class CameraSettingsEnvRangeButton extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraSettingsEnvRangeButton");
  }
}

export class CameraSettingsScreenRangeButton extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraSettingsScreenRangeButton");
  }
}

export class CameraSettingsBlobRangeButton extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#cameraSettingsBlobRangeButton");
  }
}
