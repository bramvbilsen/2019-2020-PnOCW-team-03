import { client } from "../index";

export default function masterCamera() {
    const player: JQuery<HTMLVideoElement> = $("#player");
    const mobileCaptureButton: JQuery<HTMLButtonElement> = $(
        "#mobileCaptureButton"
    );
    const pink: JQuery<HTMLButtonElement> = $("#pink");
    const green: JQuery<HTMLButtonElement> = $("#green");
    const blue: JQuery<HTMLButtonElement> = $("#blue");
    const orange: JQuery<HTMLButtonElement> = $("#orange");
    const constraints = {
        video: true
    };

    mobileCaptureButton.click(() => {
        document.getElementById("file-input").onchange = function(
            e: any = HTMLInputElement
        ) {
            console.log("i got in");
            let files: any = e.target.files[0],
                file;
            if (files && files.length > 0) {
                file = files[0];
                // processImg({ file: file });
            }
        };
    });

    pink.click(() => {
        client.color = { r: 255, g: 70, b: 181, a: 100 };
    });

    green.click(() => {
        client.color = { r: 0, g: 128, b: 0, a: 100 };
    });

    orange.click(() => {
        client.color = { r: 255, g: 69, b: 0, a: 100 };
    });

    blue.click(() => {
        client.color = { r: 0, g: 255, b: 0, a: 100 };
    });

    // Attach the video stream to the video element and autoplay.
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        player[0].srcObject = stream;
    });
}
