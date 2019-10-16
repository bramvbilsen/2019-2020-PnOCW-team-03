import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";

handleCameraInput();
const client = new Client();
//@ts-ignore
window.client = client;
