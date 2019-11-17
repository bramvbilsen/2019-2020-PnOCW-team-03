import handleCameraInput from "./scripts/frontTest";
import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/run";
import downloadTests from "./tests/download";
import { createCanvas } from "./scripts/image_processing/screen_detection/screen_detection";
import env from "./env/env";
import ImageDisplayHandler from "./scripts/image_processing/imageDisplayHandler";
import { createImageCanvasForSlave } from "./scripts/util/ImageCutHandler";
import { flattenOneLevel } from "./scripts/util/arrays";
import { BoundingBox } from "./scripts/util/BoundingBox";
import { loadImage } from "./scripts/util/images";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange,
});

export let slaveFlowHandler: SlaveFlowHandler;
export let imageDisplayHandler: ImageDisplayHandler;

//@ts-ignore
window.client = client;
//@ts-ignore
window.slaveFlowHandler = slaveFlowHandler;
//@ts-ignore
window.findScreen = findScreen;

$(() => {
    //@ts-ignore
    $("#welcome-master-no-slave-toast").toast({
        delay: 5000,
        animation: true,
    });
    const startMasterButton = $("#start-master-button");
    startMasterButton.off().on("click", () => {
        if (client.slaves.length === 0) {
            //@ts-ignore
            $("#welcome-master-no-slave-toast").toast("show");
            return;
        }
        slaveFlowHandler = new SlaveFlowHandler();
        $("#welcome-master").hide();
        $("#main-flow-master").show();
        const player: JQuery<HTMLVideoElement> = $("#player");
        $("#player-overlay").width(player.width());
        $("#player-overlay").height(player.height());
        const startButton = $("#start");
        const nextSlaveButton = $("#next-slave");
        const captureSlaveButton = $("#capture-slave");
        const showOrientationButton = $("#show-orientation-button");
        const captureOrientationButton = $("#capture-orientation");
        const loadingMasterIndicator = $("#loading-master-indicator");
        const resetButton = $("#reset");
        const uploadImage = $("#upload-image-to-display");
        const displayBaseImage = $("#display-standard-image");
        const displayImage = $("#display-uploaded-image");

        nextSlaveButton.toggle();
        captureSlaveButton.toggle();
        showOrientationButton.toggle();
        captureOrientationButton.toggle();
        loadingMasterIndicator.toggle();
        uploadImage.toggle();
        displayBaseImage.toggle();
        displayImage.toggle();

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
            loadingMasterIndicator.show();
            captureSlaveButton.toggle();
            await slaveFlowHandler.takePictureOfColoredScreen();
        });
        showOrientationButton.off().on("click", () => {
            slaveFlowHandler.showOrientationOnSlave();
            showOrientationButton.toggle();
            captureOrientationButton.toggle();
        });
        captureOrientationButton.off().on("click", () => {
            slaveFlowHandler.takePictureOfSlaveOrientation();
            captureOrientationButton.toggle();
            //LIAM HERE
            // uploadImage.toggle();
            // displayImage.toggle();
            // displayBaseImage.toggle();
        });
        resetButton.off().on("click", () => {
            slaveFlowHandler.reset();
        });

        uploadImage.off().on("click", () => {
            /**CHANGE THIS*/
            imageDisplayHandler.defaultImage();
        });

        displayImage.off().on("click", () => {
            imageDisplayHandler.defaultImage();
            imageDisplayHandler.linearScale();
            let  data = imageDisplayHandler.cutBoxOutImg();
            $("#result-img").attr("src", data)
        });

        $("#display-unicorn-img-button")
            .off()
            .on("click", async () => {
                const img = await loadImage(
                    "http://localhost:3000/images/unicorn.jpeg"
                );
                const imgCanvas = createCanvas(img.width, img.height);
                imgCanvas.getContext("2d").drawImage(img, 0, 0);
                const globalBoundingBox = new BoundingBox(
                    flattenOneLevel(
                        slaveFlowHandler.screens.map(screen => screen.corners)
                    )
                );
                slaveFlowHandler.screens.forEach(screen => {
                    const slaveImg = createImageCanvasForSlave(
                        globalBoundingBox,
                        screen,
                        imgCanvas
                    );
                    client.showCanvasImgOnSlave(screen.slaveID, slaveImg);
                });
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
});

function onConnectionTypeChange(type: ConnectionType) {
    console.log("Changed type to: " + type);
    const page: JQuery<HTMLBodyElement> = $("#page");
    page.css("background-color", `rgb(76, 175, 80)`);
    const loadingElem = $("#loading");
    if (slaveFlowHandler) {
        slaveFlowHandler.reset();
    }
    if (client.type == ConnectionType.MASTER) {
        loadingElem.css("display", "none");
        $("#slave").css("display", "none");
        $("#master").css("display", "inherit");
        $("#welcome-master").css("display", "inherit");
        $("#main-flow-master").css("display", "none");
        handleCameraInput();
    } else {
        loadingElem.css("display", "none");
        $("#master").css("display", "none");
        $("#slave").css("display", "inherit");
    }

    if (env.test) {
        $("#slave").css("display", "none");
        $("#master").css("display", "none");
        $("#countdown").css("display", "none");
    }
}

if (env.test) {
    $("#page").css("background-color", "white");
    run_tests().then(results => {
        // downloadTests(results);
    });
}
