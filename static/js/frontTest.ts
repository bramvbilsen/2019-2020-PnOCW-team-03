console.log("ok");
for (let i = 0; i < 100; i++) {
    console.log("MEHHHH");
}

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
*/


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

