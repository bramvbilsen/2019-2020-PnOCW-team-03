export default function masterCamera() {
  const player: JQuery<HTMLVideoElement> = $("#player");
  const canvas: JQuery<HTMLCanvasElement> = $("#canvas");
  const context = canvas[0].getContext('2d');
  const captureButton: JQuery<HTMLButtonElement> = $("#capture");
  const uploadButton: JQuery<HTMLButtonElement> = $("#upload");
  const mobileCaptureButton: JQuery<HTMLButtonElement> = $("#mobileCaptureButton");
  const constraints = {
    video: true
  };

  interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
  }

  captureButton.click(() => {
    //$('#camera').replaceWith($('#canvas'));
    context.drawImage(player[0], 0, 0, canvas[0].width, canvas[0].height);
    // $('#capture').replaceWith('<button id="upload" class="button2" style="vertical-align:middle"><span>Upload </span></button>');
  });

  uploadButton.click(() => {
    uploadImage();
  });


  mobileCaptureButton.click(() =>{
    //document.getElementById('file-input').click();

    document.getElementById('file-input').onchange = function(e : any = HTMLInputElement) {
      console.log('i got in');
      let files: any = e.target.files[0], file;
      if (files && files.length > 0) {
        file = files[0];
        processImg({file: file});
      }
    }
  });


  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    player[0].srcObject = stream;
  });
}

function processImg({file}: { file: any }) {
  var reader = new FileReader();
  reader.readAsDataURL(file)
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      let canvas : JQuery<HTMLCanvasElement>= $("#canvas");;
      let context = canvas[0].getContext('2d');;
      context.drawImage(img, 0,0, canvas[0].width, canvas[0].height)
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
