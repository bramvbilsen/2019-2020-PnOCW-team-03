import { client } from "../index";
export default function masterCamera() {
    const player: JQuery<HTMLVideoElement> = $("#player");
    const constraints = {
        video: true,
        facingMode: { exact: "environment" },
    };

    // Attach the video stream to the video element and autoplay.
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        player[0].srcObject = stream;
    });
}
