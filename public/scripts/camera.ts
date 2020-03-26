export default function masterCamera() {
    const player: JQuery<HTMLVideoElement> = $("#player");
    const constraints = {
        video: {
            facingMode: "environment",
        },
    };

    // Attach the video stream to the video element and autoplay.
    navigator.mediaDevices
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        player[0].srcObject = stream;

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        // @ts-ignore
        if (!('focusDistance' in capabilities)) {
            console.log('focusDistance is not supported by ' + track.label)
            return;
        }
        const _input: JQuery<HTMLInputElement> = $("#focus-distance");
        const input: HTMLInputElement = _input[0];
        // @ts-ignore
        input.min = capabilities.focusDistance.min;
        // @ts-ignore
        input.max = capabilities.focusDistance.max;
        // @ts-ignore
        input.step = capabilities.focusDistance.step;
        // @ts-ignore
        input.value = track.getSettings().focusDistance;
        input.oninput = function (event) {
            track.applyConstraints({
                //@ts-ignore
                advanced: [{ focusMode: "manual", focusDistance: event.target.value }]
            });
        }
        _input.show();
    });
}
