$(() => {


    const page: JQuery<HTMLBodyElement> = $("#page");
    page.css("background-color", "white");
});

function changeBackground(color: string) {
    if (connected) {
        const page: JQuery<HTMLBodyElement> = $("#page");
        page.css("background-color", color);
        socket.emit("master-change-background", {
            color
        });
    } else {
        console.log("NOT CONNECTED!");
    }
}