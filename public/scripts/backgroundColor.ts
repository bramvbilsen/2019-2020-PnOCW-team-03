$(() => {


    const page: JQuery<HTMLBodyElement> = $("#page");
    page.css("background-color", "white");
});

function changeBackground(color: string) {
    if (connected) {
        socket.emit("master-change-background", {
            color
        });
    } else {
        console.log("NOT CONNECTED!");
    }
}

socket.on("change-background", function (msg: {
    color: string
}) {
    const page: JQuery<HTMLBodyElement> = $("#page");
    page.css("background-color", msg.color);
});