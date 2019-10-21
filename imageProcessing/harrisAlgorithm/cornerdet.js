let video = document.getElementById('videoInput');
let src = new opencv.Mat(video.height, video.width, cv.CV_8UC4);

let gray = new cv.Mat();
let cap = new cv.VideoCapture(video);
let faces = new cv.RectVector();
let classifier = new opencv.CascadeClassifier();



// load pre-trained classifiers
classifier.load('haarcascade_frontalface_default.xml');

const FPS = 30;
function processVideo() {
    let max_thresh = 255;
    try {
        if (!streaming) {
            // clean and stop.
            src.delete();
            dst.delete();
            gray.delete();
            faces.delete();
            classifier.delete();
            return;
        }
        let begin = Date.now();
        // start processing.
        cap.read(src);
        src.copyTo(dst);
        cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
        // detect faces.
        classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
        // draw faces.
        for (let i = 0; i < faces.size(); ++i) {
            let face = faces.get(i);
            let point1 = new cv.Point(face.x, face.y);
            let point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
        }
        cv.imshow('canvasOutput', dst);
        // schedule the next one.
        let delay = 1000/FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
    } catch (err) {
        utils.printError(err);
    }
};

// schedule the first one.
setTimeout(processVideo, 0);


let dst = new cv.Mat();

function cornerHarris(src, blockSize, ksize, k, dst = null, borderType = null) {

}

function cornerHarris_demo(val, src) {
    let thresh = val;
    let blockSize = 4;
    let apertureSize = 3;
    let k = 0.02;

    dst = cv.cornerHarris(src_gray, blockSize, apertureSize, k);

}
function readImg(){
    let img_src = cv.imread('img/cornerTest.png')
    if(img_src == null){
        print('could not open or find img.')
        return;
    }
    let src_gray = cv.cvtColor(img_src, cv.COLOR_BGR2GRAY )
    let thresh = 94;
    cornerHarris_demo(thresh, src_gray);
}
/*read and display img
let src = cv.imread('canvasInput');
let dst = new cv.Mat();
// To distinguish the input and output, we graying the image.
// You can try different conversions.
cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
cv.imshow('canvasOutput', dst);
src.delete();
dst.delete();
*/