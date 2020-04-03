import HTMLElem from "../HtmlElem";

export class MasterHTMLElem extends HTMLElem {
  get elem(): HTMLDivElement {
    return document.querySelector("#master");
  }
}
