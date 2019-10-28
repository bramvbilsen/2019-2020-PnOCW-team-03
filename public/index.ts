import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import { ConnectionType } from "./scripts/types/ConnectionType";

const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange
});
//@ts-ignore
window.client = client;

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
