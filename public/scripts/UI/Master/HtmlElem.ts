export default abstract class HtmlElem {
    abstract get elem(): HTMLElement;

    onClick(callback: () => any) {
        const elem = this.elem;
        elem.onclick = callback;
    }

    toggle() {
        const elem = this.elem;
        elem.style.display = elem.style.display == "flex" ? "none" : "flex";
    }

    hide() {
        const elem = this.elem;
        elem.style.display = "none";
    }

    scale(val: number) {
        this.elem.style.scale = val.toString();
    }

    /**
     *
     * @param display Defaults to flex.
     */
    show(display?: "flex" | "block" | "none") {
        const elem = this.elem;
        elem.style.display = display || "flex";
    }

    isHidden(): boolean {
        const elemDisplay = this.elem.style.display;
        return elemDisplay == "none" || elemDisplay == "";
    }
}
