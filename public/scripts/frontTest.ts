console.log("leven is ok.");


function masterCamera() {
  const player = <HTMLVideoElement>document.getElementById("player");
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const captureButton = <HTMLButtonElement>document.getElementById("capture");
  const downloadButton = <HTMLButtonElement>document.getElementById("download");
  var link;

  const constraints = {
    video: true
  };

  captureButton.addEventListener("click", () => {
    // Draw the video frame to the canvas.
    // First num par gives us the width starting point from the canvas
    // Second num par gives us the height starting point from the canvas
    context.drawImage(player, 0, 0, canvas.width, canvas.height);
    //const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  });

  downloadButton.addEventListener("click", () => {
    canvas.toBlob(function (blob) {
      // blob ready, download it
      link = document.createElement("a");
      //console.log(link);
      link.download = "example.png";

      link.href = URL.createObjectURL(blob);
      link.click();
      // delete the internal blob reference, to let the browser clear memory from it
      //URL.revokeObjectURL(link.href);
    }, "image/png");
  });

  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    player.srcObject = stream;
  });
}

masterCamera();
/*$("input").change(function(e) {



        var file = e.originalEvent.srcElement.files[0];

        var img = document.createElement("img");
        var reader = new FileReader();
        reader.onloadend = function() {
             img.setAttribute('src', reader.result as string);
        }
        reader.readAsDataURL(file);
        $("input").after(img);

});

function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#picture-src')
                    .attr('src', e.target.result as string)
                    .width(150)
                    .height(200);
            };

            reader.readAsDataURL(input.files[0]);
        }
    }



//displayed niet, help?
function displayImg(input){
	if (input.files && input.files[0]) {
        var reader = new FileReader();
		var path = $(input).attr('src');


		//input.after(img);
		reader.onload = function(b){
			$('#picture-src').attr('src', b.target.result as string);
		};
		reader.readAsDataURL(input.files[0]);
	}
}

$("#picture").change(function(){
	displayImg(this);
});
*/
