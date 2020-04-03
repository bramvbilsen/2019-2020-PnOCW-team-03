import Client from "./scripts/client/Client";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/run";
import env from "./env/env";
import { MasterHTMLElem } from "./scripts/jsHtml/master/MasterHtml";
import {
    CameraOverlay,
    CameraEnvironmentChangeOverlay,
    CameraScreenColorsOverlay,
} from "./scripts/jsHtml/master/camera/cameraOverlays";
import {
    ConfirmScreensButton,
    CameraSettingsOpenButton,
} from "./scripts/jsHtml/master/camera/camera_buttons";
import { CameraSettings } from "./scripts/jsHtml/master/camera/settings/CameraSettings";
import { CameraSettingsCloseButon } from "./scripts/jsHtml/master/camera/settings/CameraSettingsCloseButton";
import {
    SettingSlidersEnv,
    SettingsSlidersScreen,
    SettingsSlidersBlobRange,
} from "./scripts/jsHtml/master/camera/settings/slidersRanges";
import {
    CameraSettingsBlobRangeButton,
    CameraSettingsEnvRangeButton,
    CameraSettingsScreenRangeButton,
} from "./scripts/jsHtml/master/camera/settings/cameraSettingsRangeButtons";
import { CameraRangeSelectionContainer } from "./scripts/jsHtml/master/camera/settings/CameraRangeSelectionContainer";
import { CameraSlidersContainer } from "./scripts/jsHtml/master/camera/settings/cameraSlidersContainers";
import { SettingsSlidersBackButton } from "./scripts/jsHtml/master/camera/settings/SettingsSlidersBackButton";
import { IHSLRange } from "./scripts/types/Color";
import { Camera } from "./scripts/jsHtml/master/camera/camera";
// import createTriangulationCanvas from "./scripts/image_processing/Triangulation/triangulationCanvas";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange,
});

export let slaveFlowHandler: SlaveFlowHandler;
//@ts-ignore
window.slaveFlowHandler = slaveFlowHandler;

//@ts-ignore
window.client = client;

function initMasterAfterWelcomeUI() {
    const blobPixelDistance = 5;
    const similarScreenColorRange: IHSLRange = {
        hRange: 65,
        sRange: 50,
        lRange: 40,
    };
    const diffEnvRange: IHSLRange = {
        hRange: 20,
        sRange: 100,
        lRange: 100,
    };

    new MasterHTMLElem().scale(1);
    window.scrollTo(0, 1);

    const cameraOverlayCanvas = new CameraOverlay();
    const cameraOverlayCtx = cameraOverlayCanvas.elem.getContext("2d");

    new ConfirmScreensButton().onClick(() => console.log("confirmed"));
    new CameraSettingsOpenButton().onClick(() => {
        console.log("settings");
        new CameraSettings().show();
    });
    new CameraSettingsCloseButon().onClick(() => new CameraSettings().hide());

    const settingsSlidersEnv = new SettingSlidersEnv();
    const settingsSlidersScreen = new SettingsSlidersScreen();
    const settingsSlidersBlobRange = new SettingsSlidersBlobRange();

    settingsSlidersBlobRange.value = blobPixelDistance;
    settingsSlidersBlobRange.updateText();
    settingsSlidersBlobRange.onValueChange(val => {
        settingsSlidersBlobRange.updateText();
        cameraOverlayCtx.beginPath();
        cameraOverlayCtx.moveTo(10, 10);
        cameraOverlayCtx.lineTo(10 + val, 10);
        cameraOverlayCtx.closePath();
        cameraOverlayCtx.strokeStyle = "rgb(255, 0, 50)";
        cameraOverlayCtx.stroke();
    });
    new CameraSettingsBlobRangeButton().onClick(() => {
        new CameraRangeSelectionContainer().hide();
        new CameraSlidersContainer().show();
        settingsSlidersBlobRange.show();
        settingsSlidersEnv.hide();
        settingsSlidersScreen.hide();
    });

    settingsSlidersEnv.hue = diffEnvRange.hRange;
    settingsSlidersEnv.saturation = diffEnvRange.sRange;
    settingsSlidersEnv.light = diffEnvRange.lRange;
    settingsSlidersEnv.onHueChange(_ => settingsSlidersEnv.updateHueText());
    settingsSlidersEnv.onSaturationChange(_ =>
        settingsSlidersEnv.updateSaturationText()
    );
    settingsSlidersEnv.onLightChange(_ => settingsSlidersEnv.updateLightText());
    new CameraSettingsEnvRangeButton().onClick(() => {
        new CameraRangeSelectionContainer().hide();
        new CameraSlidersContainer().show();
        new CameraEnvironmentChangeOverlay().show();
        settingsSlidersEnv.show();
        settingsSlidersBlobRange.hide();
        settingsSlidersScreen.hide();
    });

    settingsSlidersScreen.hue = similarScreenColorRange.hRange;
    settingsSlidersScreen.saturation = similarScreenColorRange.sRange;
    settingsSlidersScreen.light = similarScreenColorRange.lRange;
    settingsSlidersScreen.onHueChange(_ =>
        settingsSlidersScreen.updateHueText()
    );
    settingsSlidersScreen.onSaturationChange(_ =>
        settingsSlidersScreen.updateSaturationText()
    );
    settingsSlidersScreen.onLightChange(_ =>
        settingsSlidersScreen.updateLightText()
    );
    new CameraSettingsScreenRangeButton().onClick(() => {
        new CameraRangeSelectionContainer().hide();
        new CameraSlidersContainer().show();
        new CameraScreenColorsOverlay().show();
        settingsSlidersEnv.hide();
        settingsSlidersBlobRange.hide();
        settingsSlidersScreen.show();
    });

    new SettingsSlidersBackButton().onClick(() => {
        cameraOverlayCtx.clearRect(
            0,
            0,
            cameraOverlayCanvas.width,
            cameraOverlayCanvas.height
        );
        new CameraSlidersContainer().hide();
        new CameraEnvironmentChangeOverlay().hide();
        new CameraScreenColorsOverlay().hide();
        new CameraRangeSelectionContainer().show();
    });
}

export function resetMaster() {
    const startButton = $("#start");
    const nextSlaveButton = $("#next-slave");
    const captureSlaveButton = $("#capture-slave");
    const showOrientationButton = $("#show-orientation-button");
    const captureOrientationButton = $("#capture-orientation");
    const loadingMasterIndicator = $("#loading-master-indicator");
    const welcomeMaster = $("#welcome-master");
    const startMasterButton = $("#start-master-button");
    const mainFlowMaster = $("#main-flow-master");
    const resultImgContainer = $("#result-img-container");

    const uploadImage = $("#upload-image-to-display");
    const displayImage = $("#display-uploaded-image");

    // const {
    //     canvas: triangulationCanvas,
    //     id: triangulationCanvasID,
    // } = createTriangulationCanvas();
    // welcomeMaster.append(triangulationCanvas);

    mainFlowMaster.hide();
    startButton.hide();
    nextSlaveButton.hide();
    captureSlaveButton.hide();
    showOrientationButton.hide();
    loadingMasterIndicator.hide();
    captureOrientationButton.hide();
    resultImgContainer.removeAttr("src");
    $("#result-img").removeAttr("src");
    $("#player-overlay").removeAttr("src");
    //@ts-ignore
    $("#welcome-master-no-slave-toast").toast({
        delay: 5000,
        animation: true,
    });
    welcomeMaster.css("display", "inherit");

    startMasterButton.off().on("click", async () => {
        // triangulationCanvas.remove();
        if (client.slaves.length === 0) {
            //@ts-ignore
            $("#welcome-master-no-slave-toast").toast("show");
            return;
        }

        welcomeMaster.hide();
        mainFlowMaster.css("display", "flex");

        initMasterAfterWelcomeUI();

        const camera = new Camera();
        await camera.start();

        slaveFlowHandler = new SlaveFlowHandler(camera);
        slaveFlowHandler.detect();

        $("#display-countdown-button")
            .off()
            .on("click", async () => {
                client.notifySlavesOfStartTimeCounter();
            });

        $("#display-unicorn-img-button")
            .off()
            .on("click", async () => {
                slaveFlowHandler.screens.forEach(screen => {
                    client.showImgOnSlave(
                        screen.slaveID,
                        `${env.baseUrl}/images/unicorn.jpeg`
                    );
                });
            });

        $("#display-master-img-button")
            .off()
            .on("click", async () => {
                slaveFlowHandler.screens.forEach(screen => {
                    client.showImgOnSlave(
                        screen.slaveID,
                        `${env.baseUrl}/images/unicorn.jpeg`
                    );
                });
            });

        $("#display-delaunay-triangulation-button")
            .off()
            .on("click", async () => {
                // const triangCanvas = client.calculateTriangulationCanvas();
                // const globalBoundingBox = new BoundingBox(
                //     flattenOneLevel(
                //         slaveFlowHandler.screens.map(screen => screen.corners)
                //     )
                // );
                // slaveFlowHandler.screens.forEach(screen => {
                //     const slaveImg = createImageCanvasForSlave(
                //         globalBoundingBox,
                //         screen,
                //         slaveFlowHandler.screens,
                //         triangCanvas
                //     );
                //     client.showCanvasImgOnSlave(screen.slaveID, slaveImg);
                // });
                client.startAnimation();
            });

        $("#stop-delaunay-triangulation-button")
            .off()
            .on("click", async () => {
                client.stopAnimation();
            });

        $("#start-video-button")
            .off()
            .on("click", async () => {
                client.StartVideoOnSlaves();
            });
        $("#pause-video-button")
            .off()
            .on("click", async () => {
                client.PauseVideoOnSlaves();
            });
        $("#stop-video-button")
            .off()
            .on("click", async () => {
                client.StopVideoOnSlaves();
            });

        $(".pink")
            .off()
            .click(() => {
                client.color = {
                    r: 255,
                    g: 70,
                    b: 181,
                    a: 100,
                };
            });

        $(".green")
            .off()
            .click(() => {
                client.color = {
                    r: 0,
                    g: 128,
                    b: 0,
                    a: 100,
                };
            });

        $(".orange")
            .off()
            .click(() => {
                client.color = {
                    r: 255,
                    g: 69,
                    b: 0,
                    a: 100,
                };
            });

        $(".blue")
            .off()
            .click(() => {
                client.color = {
                    r: 0,
                    g: 0,
                    b: 255,
                    a: 100,
                };
            });
    });
}

$(() => {
    $(document).keyup(e => {
        if (e.key === "r") {
            if (slaveFlowHandler) {
                // slaveFlowHandler.reset();
            }
        }
    });
    resetMaster();
});

function onConnectionTypeChange(type: ConnectionType) {
    console.log("Changed type to: " + type);
    const page: JQuery<HTMLBodyElement> = $("#page");
    const loadingElem = $("#loading");
    if (client.type == ConnectionType.MASTER) {
        page.css("background-color", `rgb(77, 154, 227)`); //changing master color to sky blue
        $("#countdown").css("display", "none");
        loadingElem.css("display", "none");
        $("#slave").css("display", "none");
        $("#master").css("display", "inherit");
        $("#welcome-master").css("display", "inherit");
        $("#main-flow-master").css("display", "none");
        resetMaster();
    } else {
        page.css("background-color", `rgb(76, 175, 80)`); //changing client color to leprechaun green
        loadingElem.css("display", "none");
        $("#master").css("display", "none");
        $("#slave").css("display", "inherit");
    }

    if (env.test) {
        $("#slave").css("display", "none");
        $("#master").css("display", "none");
        $("#countdown").css("display", "none");
    }
}

if (env.test) {
    $("#page").css("background-color", "white");
    run_tests().then(results => {
        // downloadTests(results);
    });
}
