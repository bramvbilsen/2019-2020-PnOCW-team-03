import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";

handleCameraInput();
const client = new Client();
//@ts-ignore
window.client = client;

/*
    ARROWS
*/

// console.log("ARROWS !");
// function showArrowNorthOnSlaves() {
//     socket.emit("send-arrow-north");
// }

// function showArrowRightOnSlaves() {
//     socket.emit("send-arrow-right");
// }
