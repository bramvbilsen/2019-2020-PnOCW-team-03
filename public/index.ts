import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/run";
import env from "./env/env";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange,
});

export const slaveFlowHandler = new SlaveFlowHandler();

//@ts-ignore
window.client = client;
//@ts-ignore
window.slaveFlowHandler = slaveFlowHandler;
//@ts-ignore
window.findScreen = findScreen;

$(() => {
    const startButton = $("#start");
    const nextSlaveButton = $("#next-slave");
    const captureSlaveButton = $("#capture-slave");
    const showOrientationButton = $("#show-orientation-button");
    const captureOrientationButton = $("#capture-orientation");
    const loadingMasterIndicator = $("#loading-master-indicator");
    const resetButton = $("#reset");
    nextSlaveButton.toggle();
    captureSlaveButton.toggle();
    showOrientationButton.toggle();
    captureOrientationButton.toggle();
    loadingMasterIndicator.toggle();
    startButton.off().on("click", () => {
        slaveFlowHandler.takeNoColorPicture();
        nextSlaveButton.toggle();
    });
    nextSlaveButton.off().on("click", () => {
        slaveFlowHandler.showColorOnNextSlave();
        nextSlaveButton.toggle();
        captureSlaveButton.toggle();
    });
    captureSlaveButton.off().on("click", async () => {
        await slaveFlowHandler.takePictureOfColoredScreen();
        loadingMasterIndicator.toggle();
        captureSlaveButton.toggle();
    });
    showOrientationButton.off().on("click", () => {
        slaveFlowHandler.showOrientationOnSlave();
        showOrientationButton.toggle();
        captureOrientationButton.toggle();
    });
    captureOrientationButton.off().on("click", () => {
        slaveFlowHandler.takePictureOfSlaveOrientation();
        captureOrientationButton.toggle();
        nextSlaveButton.toggle();
    });
    resetButton.off().on("click", () => {
        slaveFlowHandler.reset();
    });

    $(".pink")
        .off()
        .click(() => {
            client.color = { r: 255, g: 70, b: 181, a: 100 };
        });

    $(".green")
        .off()
        .click(() => {
            client.color = { r: 0, g: 128, b: 0, a: 100 };
        });

    $(".orange")
        .off()
        .click(() => {
            client.color = { r: 255, g: 69, b: 0, a: 100 };
        });

    $(".blue")
        .off()
        .click(() => {
            client.color = { r: 0, g: 0, b: 255, a: 100 };
        });
});

function onConnectionTypeChange(type: ConnectionType) {
    console.log("CHANGE IN TYPE");
    if (client.type == ConnectionType.MASTER) {
        $("#loading").css("display", "none");
        $("#master").css("display", "inherit");
        handleCameraInput();
    } else {
        $("#loading").css("display", "none");
        $("#slave").css("display", "inherit");
    }
    $("#master").css("background-color", "white");
    $("#slave").css("background-color", "white");

    if (env.test) {
        $("#slave").css("display", "none");
        $("#master").css("display", "none");
        $("#countdown").css("display", "none");
    }
}

if (env.test) {
    run_tests();
}
