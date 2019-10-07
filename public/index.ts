console.log("Init client");

const socket = io.connect("http://localhost:3000");

let connected: boolean = false;

socket.on("connect", function (data) {
    console.log("connected!");
    connected = true;
});

socket.on("change-background", function (msg: {
    color: string
}) {
    console.log("Now change backgrounds");
});