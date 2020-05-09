import Client from "./scripts/client/Client";
import findScreen from "./scripts/image_processing/screen_detection/screen_detection";
import { ConnectionType } from "./scripts/types/ConnectionType";
import SlaveFlowHandler, {
    wait,
} from "./scripts/image_processing/SlaveFlowHandler";
import run_tests from "./tests/run";
import env from "./env/env";
import createTriangulationCanvas from "./scripts/image_processing/Triangulation/triangulationCanvas";
import { Camera } from "./scripts/UI/Master/Camera";
import { ScreenTracker } from "./scripts/tracking/tracking";
import { CameraOverlay } from "./scripts/UI/Master/cameraOverlays";

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
    const nextSlaveButton = $("#next-slave");
    const captureSlaveButton = $("#capture-slave");
    const showOrientationButton = $("#show-orientation-button");
    const captureOrientationButton = $("#capture-orientation");
    const loadingMasterIndicator = $("#loading-master-indicator");
    const welcomeMaster = $("#welcome-master");
    const startMasterButton = $("#start-master-button");
    const mainFlowMaster = $("#main-flow-master");
    const resultImgContainer = $("#result-img-container");

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
    $("#postDetectionContent").css("display", "none");
    welcomeMaster.css("display", "inherit");

    startMasterButton.off().on("click", async () => {
        if (client.slaves.length === 0 || innerWidth < innerHeight) {
            //@ts-ignore
            $("#welcome-master-no-slave-toast").toast("show");
            return;
        }
        $("#cameraContainer").css("display", "");
        $("#confirmButton").css("display", "inline-block");
        $("#detectionLoadingIndicator").css("display", "none");

        const camera = new Camera();
        await camera.start();

        slaveFlowHandler = new SlaveFlowHandler(camera);
        //@ts-ignore
        window.slaveFlowHandler = slaveFlowHandler;

        // Player for display master image on slaves
        const player: JQuery<HTMLVideoElement> = $("#player");
        $("#player-overlay").width(player.width());
        $("#player-overlay").height(player.height());

        $("#confirmButton")
            .off()
            .on("click", async () => {
                $("#confirmButton").off();
                $("#confirmButton").css("display", "none");
                $("#detectionLoadingIndicator").css("display", "inline-block");

                await slaveFlowHandler.detect();

                $("#cameraContainer").css("display", "none");
                $("#detectionLoadingIndicator").css("display", "none");
                $("#postDetectionContent").css("display", "");

                const {
                    canvas: triangulationCanvas,
                    id: triangulationCanvasID,
                } = createTriangulationCanvas();
                mainFlowMaster.append(triangulationCanvas);

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
                            );
                        });
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

                $("#track-slaves-button")
                    .off()
                    .on("click", async () => {
                        const screenToTrack = slaveFlowHandler.screens[0];
                        const ctx = new CameraOverlay().elem.getContext("2d");
                        ctx.clearRect(
                            0,
                            0,
                            camera.videoWidth,
                            camera.videoHeight
                        );
                        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(0, 0, camera.videoWidth, 30);
                        ctx.fillStyle = "white";
                        ctx.fillText(
                            "Match the tracking screen to its original corners and press the red button.",
                            20,
                            20
                        );
                        ctx.fillStyle = "red";
                        screenToTrack.corners.forEach((c) => {
                            ctx.beginPath();
                            ctx.arc(c.x, c.y, 10, 0, 2 * Math.PI);
                            ctx.closePath();
                            ctx.fill();
                        });
                        const {
                            crossRatio,
                        } = await client.requestTrackingScreen(
                            screenToTrack.slaveID
                        );
                        const tracker = new ScreenTracker(
                            camera,
                            screenToTrack,
                            crossRatio
                        );
                        $("#cameraContainer").css("display", "");
                        $("#confirmButton").css("display", "");
                        $("#trackingBackButton").css("display", "inline-block");
                        $("#postDetectionContent").css("display", "none");
                        $("#trackingBackButton")
                            .off()
                            .on("click", () => {
                                tracker.stop();
                                $("#cameraContainer").css("display", "none");
                                $("#trackingBackButton").css("display", "none");
                                $("#confirmButton").css("display", "none");
                                $("#postDetectionContent").css("display", "");
                            });

                        $("#confirmButton")
                            .off()
                            .on("click", async () => {
                                $("#confirmButton").css("display", "none");
                                tracker.track();
                            });
                    });

                $("#reset-master-button")
                    .off()
                    .on("click", () => {
                        resetMaster();
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

//Better name: onRefresh()
function onConnectionTypeChange(type: ConnectionType) {
    console.log("Changed type to: " + type);
    const page: JQuery<HTMLBodyElement> = $("#page");
    const video: HTMLVideoElement = <HTMLVideoElement>(
        document.getElementById("video-slave")
    );
    const loadingElem = $("#loading");
    if (slaveFlowHandler) {
        // slaveFlowHandler.reset();
    }

    $("#animation").remove();
    if (client.type == ConnectionType.MASTER) {
        page.css("background-color", `rgb(77, 154, 227)`); //changing master color to sky blue
        $("#countdown").css("display", "none");
        loadingElem.css("display", "none");
        $("#slave").css("display", "none");
        $("#master").css("display", "inherit");
        $("#welcome-master").css("display", "inherit");
        $("#main-flow-master").css("display", "none");
    } else {
        video.setAttribute("src", `${env.baseUrl}/images/bunny.mp4`);
        video.load();
        page.css("background-color", `rgb(76, 175, 80)`); //changing client color to leprechaun green
        loadingElem.css("display", "none");
        $("#master").css("display", "none");
        $("#slave").css("display", "inherit");
        $("#triangulationCanvasID").remove();
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
