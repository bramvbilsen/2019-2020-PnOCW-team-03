import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange
});
//@ts-ignore
window.client = client;
//@ts-ignore
window.findScreen = findScreen;

function onConnectionTypeChange(type: ConnectionType) {
    console.log("CHANGE IN TYPE");
    if (client.type == ConnectionType.MASTER) {
        handleCameraInput();
        //$('#page').replaceWith('<body id="page" style="height: 100vh"><video id="player" controls autoplay></video></body>');
    }
    else {
        $('#master').replaceWith('I am your slave :\\');
    }
}
