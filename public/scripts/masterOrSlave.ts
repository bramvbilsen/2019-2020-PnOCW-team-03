function show_image(src:string) {
    var img = document.createElement("img");
    img.src = src;

    // This next line will just add it to the <body> tag
    document.body.appendChild(img);
}

function openCamera() {
    socket.on("user-type",function(data: {
        type: string
    }) {
        if (data.type == "master") {
            // TODO: Open camera path
        } else {
            return;
        }
    });
}

socket.on("display-arrow-north", function() {
    show_image("../img/arrowUp.png");
});

socket.on("display-arrow-right", function() {
    show_image("../img/arrowRight.png");
});