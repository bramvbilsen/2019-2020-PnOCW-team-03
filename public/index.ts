import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler, {
    wait,
} from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/run";
import downloadTests from "./tests/download";
import { createCanvas } from "./scripts/image_processing/screen_detection/screen_detection";
import env from "./env/env";
import { loadImage } from "./scripts/util/images";
import { BoundingBox } from "./scripts/util/BoundingBox";
import { flattenOneLevel } from "./scripts/util/arrays";
import { createImageCanvasForSlave } from "./scripts/util/ImageCutHandler";
import createTriangulationCanvas from "./scripts/image_processing/Triangulation/triangulationCanvas";
import { Camera } from "./scripts/UI/Master/Camera";

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

    startMasterButton.off().on("click", async () => {
        if (client.slaves.length === 0 || innerWidth < innerHeight) {
            //@ts-ignore
            $("#welcome-master-no-slave-toast").toast("show");
            return;
        }

        $("#confirmButton").css("display", "inline-block");
        $("#detectionLoadingIndicator").css("display", "none");

        triangulationCanvas.remove();

        const camera = new Camera();
        await camera.start();

        slaveFlowHandler = new SlaveFlowHandler(camera);
        //@ts-ignore
        window.slaveFlowHandler = slaveFlowHandler;

        // Reset
        resetButton.off().on("click", () => {
            // TODO: slaveFlowHandler.reset();
        });

        // Player for display master image on slaves
        const player: JQuery<HTMLVideoElement> = $("#player");
        $("#player-overlay").width(player.width());
        $("#player-overlay").height(player.height());

        $("#confirmButton")
            .off()
            .on("click", async () => {
                $("#confirmButton").css("display", "none");
                $("#detectionLoadingIndicator").css("display", "inline-block");

                await slaveFlowHandler.startDetection();

                $("#detectionLoadingIndicator").animate(
                    {
                        width: "0px",
                        height: "0px",
                    },
                    1000
                );

                $("#cameraContainer").css("display", "none");
                $("#postDetectionContent").css("display", "bock");

                $("#display-countdown-button")
                    .off()
                    .on("click", async () => {
                        client.notifySlavesOfStartTimeCounter();
                    });
                $("#display-unicorn-img-button")
                    .off()
                    .on("click", async () => {
                        slaveFlowHandler.screens.forEach((screen) => {
                            client.showImgOnSlave(
                                screen.slaveID,
                                `${env.baseUrl}/images/unicorn.jpeg`
                            );
                        });
                    });
                $("#display-master-img-button")
                    .off()
                    .on("click", async () => {
                        slaveFlowHandler.screens.forEach((screen) => {
                            client.showImgOnSlave(
                                screen.slaveID,
                                `${env.baseUrl}/images/masterImg.png`
                                // TODO: `${env.baseUrl}/slaveImg`
                            );
                        });

                        // TODO: fix dees -> doe het weg
                        // const globalBoundingBox = new BoundingBox(
                        //     flattenOneLevel(
                        //         slaveFlowHandler.screens.map(screen => screen.corners)
                        //     )
                        // );
                        // const canvas = createCanvas(player[0].videoWidth, player[0].videoHeight);
                        // const ctx = canvas.getContext("2d");
                        // ctx.drawImage(slaveFlowHandler.blancoCanvas, 0, 0, player[0].videoWidth * slaveFlowHandler.blancoCanvasScale, player[0].videoHeight);
                        // slaveFlowHandler.screens.forEach(screen => {
                        //     const slaveImg = createImageCanvasForSlave(
                        //         globalBoundingBox,
                        //         screen,
                        //         slaveFlowHandler.screens,
                        //         canvas
                        //     );
                        //     client.showCanvasImgOnSlave(screen.slaveID, slaveImg);
                        // });
                    });
                $("#display-delaunay-triangulation-button")
                    .off()
                    .on("click", async () => {
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
                        console.log("Button pressed");
                        client.startVideoOnSlaves(
                            `${env.baseUrl}/images/bunny.mp4`
                        );
                    });
                $("#toggle-video-button")
                    .off()
                    .on("click", async () => {
                        client.PauseVideoOnSlaves();
                    });
                $("#stop-video-button")
                    .off()
                    .on("click", async () => {
                        client.StopVideoOnSlaves();
                    });
            });

        welcomeMaster.css("display", "none");
        mainFlowMaster.css("display", "inherit");
    });
}

$(() => {
    $(document).keyup((e) => {
        if (e.key === "r") {
            if (slaveFlowHandler) {
                // slaveFlowHandler.reset();
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
        // slaveFlowHandler.reset();
    }
    if (client.type == ConnectionType.MASTER) {
        page.css("background-color", `rgb(77, 154, 227)`); //changing master color to sky blue
        $("#countdown").css("display", "none");
        loadingElem.css("display", "none");
        $("#slave").css("display", "none");
        $("#master").css("display", "inherit");
        $("#welcome-master").css("display", "inherit");
        $("#main-flow-master").css("display", "none");
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
    run_tests().then((results) => {
        // downloadTests(results);
    });
}
