function openCamera() {
    socket.on("user-type",function(data: {
        type: string
    }) {
        if (data.type == "master") {
            // Open camera path
        } else {
            // Ignore
        }
    });
}