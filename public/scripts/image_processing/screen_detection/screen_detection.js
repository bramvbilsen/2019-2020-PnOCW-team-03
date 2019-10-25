/**
 *
 * @param {string} src - Path/src of image.
 * @returns {Promise<Image>}
 */
async function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			img.src = src;
			resolve(img);
		};
		img.onerror = err => {
			reject(err);
		};
	});
}

function createCanvas(width, height) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}
