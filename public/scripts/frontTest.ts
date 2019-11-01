import findScreen from "./image_processing/screen_detection/screen_detection";
import { IHSLColor, IRGBAColor } from "./types/Color"
import { client, slaveFlowHandler } from '../index'

import env from "../env/env";
import { WorkflowStep } from "./image_processing/SlaveFlowHandler";

export default function masterCamera() {
  const player: JQuery<HTMLVideoElement> = $("#player");
  const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
  const context = canvas[0].getContext('2d');
  const captureButton: JQuery<HTMLButtonElement> = $("#capture");
  const nextSlaveButton: JQuery<HTMLButtonElement> = $("#next-slave");
  const uploadButton: JQuery<HTMLButtonElement> = $("#upload");
  const mobileCaptureButton: JQuery<HTMLButtonElement> = $("#mobileCaptureButton");
  const pink: JQuery<HTMLButtonElement> = $("#pink");
  const green: JQuery<HTMLButtonElement> = $("#green");
  const blue: JQuery<HTMLButtonElement> = $("#blue");
  const orange: JQuery<HTMLButtonElement> = $("#orange");
  const constraints = {
    video: true
  };

  interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
  }


  captureButton.click(() => {
    console.log("CLICKED CAPTURE BUTTON");
    slaveFlowHandler.takeNoColorPicture();
  });

  nextSlaveButton.click(() => {
    console.log("CLICKED ON NEXT SLAVE");
    slaveFlowHandler.showColorOnNextSlave();
    nextSlaveButton.click(null);
  });

  uploadButton.click(() => {
    uploadImage();
  });


  mobileCaptureButton.click(() => {
    //document.getElementById('file-input').click();

    document.getElementById('file-input').onchange = function (e: any = HTMLInputElement) {
      console.log('i got in');
      let files: any = e.target.files[0], file;
      if (files && files.length > 0) {
        file = files[0];
        processImg({ file: file });
      }
    }
  });

  pink.click(() => {
    client.color = { r: 255, g: 70, b: 181, a: 100 }
  });

  green.click(() => {
    client.color = { r: 0, g: 128, b: 0, a: 100 }
  });

  orange.click(() => {
    client.color = { r: 255, g: 69, b: 0, a: 100 }
  });

  blue.click(() => {
    client.color = { r: 0, g: 255, b: 0, a: 100 }
  });

  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    player[0].srcObject = stream;
  });
}

function processImg({ file }: { file: any }) {
  var reader = new FileReader();
  reader.readAsDataURL(file)
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      let canvas: JQuery<HTMLCanvasElement> = $("#canvas");
      let context = canvas[0].getContext('2d');
      context.drawImage(img, 0, 0, canvas[0].width, canvas[0].height)
    }
    if (typeof reader.result === "string") {
      img.setAttribute('src', reader.result);
    }
  }
}

function uploadImage() {
  const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
  const pink = {
    h: 324,
    s: 100.0,
    l: 63.7
  };
  const blueGreen = {
    h: 180,
    s: 100,
    l: 50
  }

  canvas[0].toBlob((blob) => {
    console.log(blob);
    let formData = new FormData();
    formData.append("image", blob, "image.png");
    $.ajax({
      url: `${env.baseUrl}/slaveImg`,
      type: "POST",
      contentType: false,
      cache: false,
      processData: false,
      data: formData,
      success: (data: any) => {
        console.log("Success: " + data);
      },
      error: () => {
        console.log("ERROR UPLOADING IMAGE");
      }
    });
  });
}
