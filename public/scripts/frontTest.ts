import findScreen from "./image_processing/screen_detection/screen_detection";

export default function masterCamera() {
  const player: JQuery<HTMLVideoElement> = $("#player");
  const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
  const context = canvas[0].getContext('2d');
  const captureButton: JQuery<HTMLButtonElement> = $("#capture");
  const uploadButton: JQuery<HTMLButtonElement> = $("#upload");
  const constraints = {
    video: true
  };

  captureButton.click(() => {
    //$('#camera').replaceWith($('#canvas'));
    context.drawImage(player[0], 0, 0, canvas[0].width, canvas[0].height);
    // $('#capture').replaceWith('<button id="upload" class="button2" style="vertical-align:middle"><span>Upload </span></button>');
  });
  uploadButton.click(() => {
    uploadImage();
  });

  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    player[0].srcObject = stream;
  });
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
  /*
  findScreen(pink, canvas[0].toDataURL()).then((newCanvas) => {
    $("#canvas").replaceWith(newCanvas);
  });
  */
  findScreen(pink, canvas[0].toDataURL());
  
  canvas[0].toBlob((blob) => {
    console.log(blob);
    let formData = new FormData();
    formData.append("image", blob, "image.png");
    $.ajax({
      url: "http://localhost:3000/slaveImg",
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
