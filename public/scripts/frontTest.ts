import findScreen from "./image_processing/screen_detection/screen_detection";
import { IHSLColor, IRGBAColor } from "./types/Color"
import { client, slaveFlowHandler } from '../index'

import env from "../env/env";
import { WorkflowStep } from "./image_processing/SlaveFlowHandler";

export default function masterCamera() {
  const player: JQuery<HTMLVideoElement> = $("#player");
  const captureButton: JQuery<HTMLButtonElement> = $("#capture");
  const startButton: JQuery<HTMLButtonElement> = $("#start");
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


  startButton.click(() => {
    console.log("CLICKED START BUTTON");
    slaveFlowHandler.takeNoColorPicture();
  });

  captureButton.click(() => {
    console.log("CLICKED CAPTURE BUTTON");
    slaveFlowHandler.takePictureOfColoredScreen();
  });

  nextSlaveButton.click(() => {
    console.log("CLICKED ON NEXT SLAVE");
    slaveFlowHandler.showColorOnNextSlave();
    nextSlaveButton.click(null);
  });


  mobileCaptureButton.click(() => {
    document.getElementById('file-input').onchange = function (e: any = HTMLInputElement) {
      console.log('i got in');
      let files: any = e.target.files[0], file;
      if (files && files.length > 0) {
        file = files[0];
        // processImg({ file: file });
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
