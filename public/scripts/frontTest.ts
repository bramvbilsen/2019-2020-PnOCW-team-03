import { client } from "../index";
export default function masterCamera() {
    const player: JQuery<HTMLVideoElement> = $("#player");
    const mobileCaptureButton: JQuery<HTMLButtonElement> = $(
        "#mobileCaptureButton"
    );
    const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
    const context = canvas[0].getContext('2d');
    const pink: JQuery<HTMLButtonElement> = $("#pink");
    const green: JQuery<HTMLButtonElement> = $("#green");
    const blue: JQuery<HTMLButtonElement> = $("#blue");
    const orange: JQuery<HTMLButtonElement> = $("#orange");
    const constraints = {
        video: true
    };

    mobileCaptureButton.click(()=>{
        console.log('i got in mobile');
        processMobileImgUpload();
    });

    function processMobileImgUpload(){
        console.log('i got in')
        var img = new Image();
        img.onload= draw;
        img.onerror = failed;
        img.src = URL.createObjectURL(this.files[0]);
        /*var file = document.querySelector('input[type=blob]');
        var reader = new FileReader();
        file instanceof Blob;
        reader.addEventListener("load", function () {
            img.src = reader.result as string;
        }, false);

        if(file){
            // @ts-ignore
            img = reader.readAsDataURL(file);
        }*/
    }

    function draw(){
        canvas.width = this.width;
        canvas.height = this.height;
        context.drawImage(this, 0, 0)
    }

    function failed(){
        console.error("File couldn't be processed as an img file.")
    }
    /*
    processMobileImgUpload(){
        var img = document.querySelector('img');
        var file = document.querySelector('input[type=blob]');
        var reader = new FileReader();
        file instanceof Blob;
        reader.addEventListener("load", function () {
            img.src = reader.result as string;
        }, false);

        if(file){
            // @ts-ignore
            img = reader.readAsDataURL(file);
        }
    }
    */
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
