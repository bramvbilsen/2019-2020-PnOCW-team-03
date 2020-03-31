import handleCameraInput from "./scripts/camera";
import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/run";
import downloadTests from "./tests/download";
import { createCanvas } from "./scripts/image_processing/screen_detection/screen_detection";
import env from "./env/env";
import { loadImage } from "./scripts/util/images";
import { BoundingBox } from "./scripts/util/BoundingBox";
import { flattenOneLevel } from "./scripts/util/arrays";
import { createImageCanvasForSlave } from "./scripts/util/ImageCutHandler";
import createTriangulationCanvas from "./scripts/image_processing/Triangulation/triangulationCanvas";

export const client = new Client({
    onConnectionTypeChange: onConnectionTypeChange,
});

export let slaveFlowHandler: SlaveFlowHandler;

//@ts-ignore
window.client = client;
//@ts-ignore
window.findScreen = findScreen;
//@ts-ignore
//window.imageDisplayHandler = imageDisplayHandler(slaveFlowHandler.screens);

export function resetMaster() {
    const startButton = $("#start");
    const startAutomatedButton = $("#start-automated");
    const nextSlaveButton = $("#next-slave");
    const captureSlaveButton = $("#capture-slave");
    const showOrientationButton = $("#show-orientation-button");
    const captureOrientationButton = $("#capture-orientation");
    const loadingMasterIndicator = $("#loading-master-indicator");
    const resetButton = $("#reset");
    const welcomeMaster = $("#welcome-master");
    const startMasterButton = $("#start-master-button");
    const mainFlowMaster = $("#main-flow-master");
    const resultImgContainer = $("#result-img-container");

    const uploadImage = $("#upload-image-to-display");
    const displayImage = $("#display-uploaded-image");

    const {
        canvas: triangulationCanvas,
        id: triangulationCanvasID,
    } = createTriangulationCanvas();
    welcomeMaster.append(triangulationCanvas);

    mainFlowMaster.hide();
    startButton.hide();
    nextSlaveButton.hide();
    captureSlaveButton.hide();
    showOrientationButton.hide();
    loadingMasterIndicator.hide();
    captureOrientationButton.hide();
    resultImgContainer.removeAttr("src");
    $("#result-img").removeAttr("src");
    $("#player-overlay").removeAttr("src");
    //@ts-ignore
    $("#welcome-master-no-slave-toast").toast({
        delay: 5000,
        animation: true,
    });
    welcomeMaster.css("display", "inherit");

    startMasterButton.off().on("click", () => {
        triangulationCanvas.remove();
        if (client.slaves.length === 0) {
            //@ts-ignore
            $("#welcome-master-no-slave-toast").toast("show");
            return;
        }
        slaveFlowHandler = new SlaveFlowHandler();
        //@ts-ignore
        window.slaveFlowHandler = slaveFlowHandler;

        welcomeMaster.css("display", "none");
        mainFlowMaster.css("display", "inherit");
        const player: JQuery<HTMLVideoElement> = $("#player");
        $("#player-overlay").css("width", "640px");
        $("#player-overlay").css("height", "480px");

        startButton.show();
        startAutomatedButton.hide();

        startAutomatedButton.off().on("click", () => {
            slaveFlowHandler.automated = true;
            startAutomatedButton.hide();
            startButton.hide();
            slaveFlowHandler.nextStep();
        });
        startButton.off().on("click", () => {
            startAutomatedButton.hide();
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
        });
        resetButton.off().on("click", () => {
            slaveFlowHandler.reset();
        });

        $("#display-countdown-button")
            .off()
            .on("click", async () => {
                client.notifySlavesOfStartTimeCounter();
                /*
                const img = await loadImage(
                    env.baseUrl + "/images/creeper-left.png"
                );
                const imgCanvas = createCanvas(img.width, img.height);
                imgCanvas.getContext("2d").drawImage(img, 0, 0);

                slaveFlowHandler.screens.forEach(screen => {
                    client.showCanvasImgOnSlave(screen.slaveID, imgCanvas);
                });
                */
            });

        $("#display-unicorn-img-button")
            .off()
            .on("click", async () => {
                slaveFlowHandler.screens.forEach(screen => {
                    client.showImgOnSlave(
                        screen.slaveID,
                        `${env.baseUrl}/images/unicorn.jpeg`
                    );
                });
            });

        $("#display-master-img-button")
            .off()
            .on("click", async () => {
                slaveFlowHandler.screens.forEach(screen => {
                    client.showImgOnSlave(
                        screen.slaveID,
                        `${env.baseUrl}/images/unicorn.jpeg`
                    );
                });
            });

        $("#display-delaunay-triangulation-button")
            .off()
            .on("click", async () => {
                // const triangCanvas = client.calculateTriangulationCanvas();
                // const globalBoundingBox = new BoundingBox(
                //     flattenOneLevel(
                //         slaveFlowHandler.screens.map(screen => screen.corners)
                //     )
                // );
                // slaveFlowHandler.screens.forEach(screen => {
                //     const slaveImg = createImageCanvasForSlave(
                //         globalBoundingBox,
                //         screen,
                //         slaveFlowHandler.screens,
                //         triangCanvas
                //     );
                //     client.showCanvasImgOnSlave(screen.slaveID, slaveImg);
                // });
                client.startAnimation();
            });

        $("#stop-delaunay-triangulation-button")
            .off()
            .on("click", async () => {
                client.stopAnimation();
            });

        $("#start-video-button")
            .off()
            .on("click", async () => {
                client.notifySlavesOfStartTimeVideo();
            });
        $("#pause-video-button")
            .off()
            .on("click", async () => {
                client.PauseVideo();
            });
        $("#stop-video-button")
            .off()
            .on("click", async () => {
                client.StopVideo();;
            });

        $(".pink")
            .off()
            .click(() => {
                client.color = {
                    r: 255,
                    g: 70,
                    b: 181,
                    a: 100,
                };
            });

        $(".green")
            .off()
            .click(() => {
                client.color = {
                    r: 0,
                    g: 128,
                    b: 0,
                    a: 100,
                };
            });

        $(".orange")
            .off()
            .click(() => {
                client.color = {
                    r: 255,
                    g: 69,
                    b: 0,
                    a: 100,
                };
            });

        $(".blue")
            .off()
            .click(() => {
                client.color = {
                    r: 0,
                    g: 0,
                    b: 255,
                    a: 100,
                };
            });
    });
}

$(() => {
    $(document).keyup(e => {
        if (e.key === "r") {
            if (slaveFlowHandler) {
                slaveFlowHandler.reset();
            }
        }
    });
    resetMaster();
});

function onConnectionTypeChange(type: ConnectionType) {
    console.log("Changed type to: " + type);
    const page: JQuery<HTMLBodyElement> = $("#page");
    const loadingElem = $("#loading");
    if (slaveFlowHandler) {
        slaveFlowHandler.reset();
    }
    if (client.type == ConnectionType.MASTER) {
        page.css("background-color", `rgb(77, 154, 227)`); //changing master color to sky blue
        $("#countdown").css("display", "none");
        loadingElem.css("display", "none");
        $("#slave").css("display", "none");
        $("#master").css("display", "inherit");
        $("#welcome-master").css("display", "inherit");
        $("#main-flow-master").css("display", "none");
        handleCameraInput();
    } else {
        page.css("background-color", `rgb(76, 175, 80)`); //changing client color to leprechaun green
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
