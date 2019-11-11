import findScreen, {
    createCanvas
} from "../scripts/image_processing/screen_detection/screen_detection";

export default function run_tests() {
    noScreensTest();
}

async function noScreensTest() {
    const blanoCanvas = createCanvas(1280, 720);
    const blancoCtx = blanoCanvas.getContext("2d");
    blancoCtx.fillStyle = "rgb(255, 255, 255)";
    blancoCtx.fillRect(0, 0, 1280, 720);
    const coloredCanvas = createCanvas(1280, 720);
    const coloredCtx = coloredCanvas.getContext("2d");
    coloredCtx.fillStyle = "rgb(255, 255, 255)";
    coloredCtx.fillRect(0, 0, 1280, 720);
    const result = await findScreen(blanoCanvas, coloredCanvas, {
        r: 255,
        g: 70,
        b: 181,
        a: 100
    });
    console.log(`\n\n\nNo Screens Test: ${result}\n\n\n`);
}
