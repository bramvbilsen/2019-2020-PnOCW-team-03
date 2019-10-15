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
    context.drawImage(player[0], 0, 0, canvas[0].width, canvas[0].height);
  });
  uploadButton.click(() => {
    console.log("Yay");
    uploadImage();
  });

  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    player[0].srcObject = stream;
  });
}

function uploadImage() {
  console.log("uploading image!!! ok");
  const canvas: JQuery<HTMLCanvasElement> = $("#canvas");

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

// console.log("OKKKK");

// masterCamera();
