import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/screen_detection_test";
import env from "./env/env";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange
});

export const slaveFlowHandler = new SlaveFlowHandler();

//@ts-ignore
window.client = client;
//@ts-ignore
window.slaveFlowHandler = slaveFlowHandler;
//@ts-ignore
window.findScreen = findScreen;

$(() => {
    const startButton = $("#start");
    const nextSlaveButton = $("#next-slave");
    const captureSlaveButton = $("#capture-slave");
    const showOrientationButton = $("#show-orientation-button");
    const captureOrientationButton = $("#capture-orientation");
    const resetButton = $("#reset");
    nextSlaveButton.toggle();
    captureSlaveButton.toggle();
    showOrientationButton.toggle();
    captureOrientationButton.toggle();
    startButton.off().on("click", () => {
        slaveFlowHandler.takeNoColorPicture();
        nextSlaveButton.toggle();
    });
    nextSlaveButton.off().on("click", () => {
        slaveFlowHandler.showColorOnNextSlave();
        nextSlaveButton.toggle();
        captureSlaveButton.toggle();
    });
    captureSlaveButton.off().on("click", async () => {
        await slaveFlowHandler.takePictureOfColoredScreen();
        captureSlaveButton.toggle();
        showOrientationButton.toggle();
    });
    showOrientationButton.off().on("click", () => {
        slaveFlowHandler.showOrientationOnSlave();
        showOrientationButton.toggle();
        captureOrientationButton.toggle();
    });
    captureOrientationButton.off().on("click", () => {
        slaveFlowHandler.takePictureOfSlaveOrientation();
        captureOrientationButton.toggle();
        nextSlaveButton.toggle();
    });
    resetButton.off().on("click", () => {
        slaveFlowHandler.reset();
    });

    $(".pink")
        .off()
        .click(() => {
            client.color = { r: 255, g: 70, b: 181, a: 100 };
        });

    $(".green")
        .off()
        .click(() => {
            client.color = { r: 0, g: 128, b: 0, a: 100 };
        });

    $(".orange")
        .off()
        .click(() => {
            client.color = { r: 255, g: 69, b: 0, a: 100 };
        });

    $(".blue")
        .off()
        .click(() => {
            client.color = { r: 0, g: 0, b: 255, a: 100 };
        });
});

function onConnectionTypeChange(type: ConnectionType) {
    console.log("CHANGE IN TYPE");
    if (client.type == ConnectionType.MASTER) {
        $("#loading").css("display", "none");
        $("#master").css("display", "inherit");
        handleCameraInput();
    } else {
        $("#loading").css("display", "none");
        $("#slave").css("display", "inherit");
    }
    $("#master").css("background-color", "white");
    $("#slave").css("background-color", "white");
}

// /* ------ SYNCHRONISATIE ------- */
// // src: https://stackoverflow.com/questions/20269657/right-way-to-get-web-server-time-and-display-it-on-web-pages/20270636#20270636

// var xmlHttp: XMLHttpRequest;
// function srvTime() {
//     try {
//         //FF, Opera, Safari, Chrome
//         xmlHttp = new XMLHttpRequest();
//     } catch (err1) {
//         //IE
//         try {
//             xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
//         } catch (err2) {
//             try {
//                 xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
//             } catch (eerr3) {
//                 //AJAX not supported, use CPU time.
//                 alert("AJAX not supported");
//             }
//         }
//     }
//     xmlHttp.open("HEAD", window.location.href.toString(), false);
//     xmlHttp.setRequestHeader("Content-Type", "text/html");
//     xmlHttp.send("");
//     return xmlHttp.getResponseHeader("Date");
// }

// function getDifferenceWithServer() {
//     var st = srvTime();
//     var serverSeconds = new Date(st).getSeconds();
//     var localSeconds = new Date().getSeconds();

//     return localSeconds - serverSeconds;
// }

// alert(getDifferenceWithServer() + " seconds difference with the server");

// /* ------- COUNTDOWN ------- */
// // src: https://www.w3schools.com/howto/howto_js_countdown.asp

// // Set the date we're counting down to
// var countDownDate = new Date("Nov 12, 2019 18:30:00").getTime();

// // Update the count down every 1 second
// var x = setInterval(function () {

//     // Get today's date and time
//     var now = new Date().getTime();

//     // Find the distance between now and the count down date
//     var seconds = countDownDate - now;
//     seconds = seconds / 1000;

//     /*
//     // Time calculations for days, hours, minutes and seconds
//     var days = Math.floor(distance / (1000 * 60 * 60 * 24));
//     var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//     var seconds = Math.floor((distance % (1000 * 60)) / 1000);
//     */

//     // Display the result in the element with id="countdown"
//     document.getElementById("countdown").innerHTML = seconds + "s ";

//     // If the count down is finished, write some text
//     if (seconds < 0) {
//         clearInterval(x);
//         document.getElementById("countdown").innerHTML = "BOOOOOM";
//     }
// }, 1);


// // --- COUNTDOWN MAARTEN

// function master(startdate: number) {
//     var eta_ms = startdate - Date.now();
//     var timeout = setTimeout(function () {
//         const tenseconds = 10000;
//         var enddate = new Date(startdate + tenseconds);
//         countdown(enddate.getTime());
//     }, eta_ms);
// }

// function countdown(endDate: number) {
//     var timer = setInterval(function () {

//         let now = new Date().getTime();
//         var t = Math.floor(((endDate - now) % (1000 * 60)) / 1000);

//         if (t > 0) {
//             document.getElementById("countdown").innerHTML = t.toString();
//         }

//         else {
//             document.getElementById("countdown").innerHTML = "Tadaaaaa";
//             clearinterval();
//         }

//     }, 1);
//     function clearinterval() {
//         clearInterval(timer);
//     }
// }


if (env.test) {
    $(() => {
        run_tests();
    });
}
