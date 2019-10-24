import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import { ConnectionType } from "./scripts/types/ConnectionType";

handleCameraInput();
const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange
});
//@ts-ignore
window.client = client;

function onConnectionTypeChange(type: ConnectionType) {

}