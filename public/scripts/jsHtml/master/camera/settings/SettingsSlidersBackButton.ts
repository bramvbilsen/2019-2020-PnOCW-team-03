import HtmlElem from "../../../HtmlElem";

export class SettingsSlidersBackButton extends HtmlElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#settingsSlidersBackButton");
  }
}
