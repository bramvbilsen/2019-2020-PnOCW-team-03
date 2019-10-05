const socket = io.connect("http://localhost:3000");
socket.on("connect", function (data) {
    console.log("connected");
});