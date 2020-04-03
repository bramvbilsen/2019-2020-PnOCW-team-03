import HtmlElem from "../../../HtmlElem";
import { IHSLRange } from "../../../../types/Color";

abstract class HSLSliders extends HtmlElem {
    abstract get hueSlider(): HTMLInputElement;
    abstract get saturationSlider(): HTMLInputElement;
    abstract get lightSlider(): HTMLInputElement;

    protected abstract get hueText(): HTMLElement;
    protected abstract get saturationText(): HTMLElement;
    protected abstract get lightText(): HTMLElement;

    constructor() {
        super();
        this.updateHueText();
        this.updateSaturationText();
        this.updateLightText();
    }

    set hue(val: number) {
        this.hueSlider.value = val.toString();
    }

    set saturation(val: number) {
        this.saturationSlider.value = val.toString();
    }

    set light(val: number) {
        this.lightSlider.value = val.toString();
    }

    get hue() {
        return this.hueSlider.valueAsNumber;
    }

    get saturation() {
        return this.saturationSlider.valueAsNumber;
    }

    get light() {
        return this.lightSlider.valueAsNumber;
    }

    onHueChange(callback: (val: number) => any) {
        this.hueSlider.oninput = () => callback(this.hue);
    }
    onSaturationChange(callback: (val: number) => any) {
        this.saturationSlider.oninput = () => callback(this.saturation);
    }
    onLightChange(callback: (val: number) => any) {
        this.lightSlider.oninput = () => callback(this.light);
    }

    updateHueText() {
        const hue = this.hue;
        const hueText = this.hueText;
        hueText.innerText =
            hueText.innerText.substring(0, hueText.innerText.indexOf(":") + 1) +
            hue;
    }

    updateSaturationText() {
        const saturation = this.saturation;
        const saturationText = this.saturationText;
        saturationText.innerText =
            saturationText.innerText.substring(
                0,
                saturationText.innerText.indexOf(":") + 1
            ) + saturation;
    }

    updateLightText() {
        const light = this.light;
        const lightText = this.lightText;
        lightText.innerText =
            lightText.innerText.substring(
                0,
                lightText.innerText.indexOf(":") + 1
            ) + light;
    }

    toHSLRange(): IHSLRange {
        return {
            hRange: this.hue,
            sRange: this.saturation,
            lRange: this.light,
        };
    }
}

export class SettingSlidersEnv extends HSLSliders {
    protected get hueText(): HTMLElement {
        return document.getElementById("settingSlidersTextEnv_h");
    }
    protected get saturationText(): HTMLElement {
        return document.getElementById("settingSlidersTextEnv_s");
    }
    protected get lightText(): HTMLElement {
        return document.getElementById("settingSlidersTextEnv_l");
    }

    get elem(): HTMLDivElement {
        return document.querySelector("#settingSlidersEnv");
    }

    get hueSlider() {
        return <HTMLInputElement>document.querySelector("#settingSlidersEnv_h");
    }
    get saturationSlider() {
        return <HTMLInputElement>document.querySelector("#settingSlidersEnv_s");
    }
    get lightSlider() {
        return <HTMLInputElement>document.querySelector("#settingSlidersEnv_l");
    }
}

export class SettingsSlidersScreen extends HSLSliders {
    protected get hueText(): HTMLElement {
        return document.getElementById("settingsSlidersTextScreen_h");
    }
    protected get saturationText(): HTMLElement {
        return document.getElementById("settingsSlidersTextScreen_s");
    }
    protected get lightText(): HTMLElement {
        return document.getElementById("settingsSlidersTextScreen_l");
    }

    get elem(): HTMLDivElement {
        return document.querySelector("#settingsSlidersScreen");
    }

    get hueSlider() {
        return <HTMLInputElement>(
            document.querySelector("#settingsSlidersScreen_h")
        );
    }
    get saturationSlider() {
        return <HTMLInputElement>(
            document.querySelector("#settingsSlidersScreen_s")
        );
    }
    get lightSlider() {
        return <HTMLInputElement>(
            document.querySelector("#settingsSlidersScreen_l")
        );
    }
}

export class SettingsSlidersBlobRange extends HtmlElem {
    get elem(): HTMLDivElement {
        return document.querySelector("#settingsSlidersBlobRange");
    }

    get slider() {
        return <HTMLInputElement>(
            document.querySelector("#settingsSlidersBlobRange_slider")
        );
    }

    get value() {
        return this.slider.valueAsNumber;
    }

    set value(val: number) {
        this.slider.value = val.toString();
    }

    onValueChange(callback: (val: number) => any) {
        this.slider.oninput = () => callback(this.value);
    }

    protected get text(): HTMLElement {
        return document.getElementById("settingsSlidersBlobRange_text");
    }

    updateText() {
        const val = this.value;
        const text = this.text;
        text.innerText =
            text.innerText.substring(0, text.innerText.indexOf(":") + 1) + val;
    }
}
