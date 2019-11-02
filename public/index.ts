import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler from "./scripts/image_processing/SlaveFlowHandler";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange
});

export const slaveFlowHandler = new SlaveFlowHandler();

//@ts-ignore
window.client = client;
//@ts-ignore
window.findScreen = findScreen;

$(() => {
    const startButton = $("#start");
    const nextSlaveButton = $("#next-slave");
    const captureButton = $("#capture");
    nextSlaveButton.toggle();
    captureButton.toggle();
    startButton.off().on("click", () => {
        slaveFlowHandler.takeNoColorPicture();
        nextSlaveButton.toggle();
    });
    nextSlaveButton.off().on("click", () => {
        slaveFlowHandler.showColorOnNextSlave();
        nextSlaveButton.toggle();
        captureButton.toggle();
    });
    captureButton.off().on("click", async () => {
        await slaveFlowHandler.takePictureOfColoredScreen();
        nextSlaveButton.toggle();
        captureButton.toggle();
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
        $("#slave").append($("<div>Slave</div>"));
    }
    $("#master").css("background-color", "white");
    $("#slave").css("background-color", "white");
}
