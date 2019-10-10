function masterCamera() {
  // uploadButton.addEventListener("click", () => {
  //   canvas.toBlob(function (blob) {
  //     // blob ready, download it
  //     link = document.createElement("a");
  //     //console.log(link);
  //     link.download = "example.png";

  //     link.href = URL.createObjectURL(blob);
  //     link.click();
  //     // delete the internal blob reference, to let the browser clear memory from it
  //     //URL.revokeObjectURL(link.href);
  //   }, "image/png");
  // });

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
    const file = new File([blob], "capture.jpg", {
      type: 'image/jpg'
    });
    let formData = new FormData();
    formData.append("image", file);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', "http://localhost:3000/slaveImg", true);
    xhr.onload = function (e) {
      console.log('Sent');
    };
    xhr.send(blob);
    $.ajax({
      url: "http://localhost:3000/slaveImg",
      type: "POST",
      cache: false,
      processData: false,
      data: formData,
    });
  });
}

console.log("OKKKK");

masterCamera();
