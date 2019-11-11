class Point {
	/**
	 * Creates a point.
	 * @param {number} x - The upper left x-coord
	 * @param {number} y - The upper left y-coord
	 */
	constructor(x, y) {
		this.x = x;
		this.y = y;
  }
    
  equals(other) {
    return this.x == other.x && this.y == other.y;
  }
}

/**
	 * Calculates the coordinates of the closest surrounding box around the screens.
	 * @param {array} list - A list with the points of the screens.
	 */
function getSurroundingBoxPoints(list) {
    let highestX = 0;
    let lowestX = 0;
    let highestY = 0;
    let lowestY = 0;

    list.forEach(point => {
        if (point.x > highestX) highestX = point.x;
        if (point.x < lowestX) lowestX = point.x;
        if (point.y > highestY) highestY = point.y;
        if (point.y < lowestY) lowestY = point.y;
    });

    return [new Point(lowestX,lowestY), new Point(highestX,highestY)];
}

/**
	 * Translates the points of the screens to just fit the surrounding box.
     * Returns the width, height and the list with the translated points.
     * @param {number} lowestX - The lowest x-value.
     * @param {number} lowestY - The lowest Y-value
	 * @param {array} list - A list with the points of the screens.
	 */
function getPointsTranslatedToBox(lowestX, lowestY, list) {
    for (let i = 0; i < list.length; i++) {
        const point = list[i];
        list[i] = new Point(point.x-lowestX, point.y-lowestY);
    }

    return list;
}

/**
	 * Translates the points of the boxed screens to find their coordinates on the image to project.
     * Returns the list with the translated points.
     * @param {number} width - The width of the image to cast.
     * @param {number} height - The height of the image to cast.
     * @param {number} screenWidth - The width of the image with the screens.
     * @param {number} screenHeight - The height of the image with the screens.
	 * @param {array} list - A list with the points of the screens.
     * @param {boolean} center - Whether or not to center the image.
	 */
function getPointsTranslatedToImage(width, height, screenWidth, screenHeight, list, center) {
    let xRatio = width / screenWidth;
    let yRatio = height / screenHeight;
    let ratio = Math.min(xRatio, yRatio);

    let deltaX = 0
    let deltaY = 0
    if (center) {
        if (xRatio > yRatio) {
            deltaX = width - Math.floor(screenWidth * yRatio);
        }
        if (yRatio > xRatio) {
            deltaY = height - Math.floor(screenHeight * xRatio);
        }
    }

    for (let i = 0; i < list.length; i++) {
        const point = list[i];
        list[i] = new Point(point.x * ratio + deltaX, point.y * ratio + deltaY); // TODO: Math.floor() ?
    }

    return list;
}

/**
	 * Translates the points of the screens to find their coordinates on the image to project.
     * Returns the list with the translated points.
     * @param {number} width - The width of the image to cast.
     * @param {number} height - The height of the image to cast.
	 * @param {array} list - A list with the points of the screens.
     * @param {boolean} center - Whether or not to center the image. (Default: false)
	 */
function getPointsTranslatedToImage(width, height, list, center = false) {
    let box = getSurroundingBoxPoints(list);
    let screenWidth = box[1].x - box[0].x;
    let screenHeight = box[1].y - box[0].y;
    let translatedList = getPointsTranslatedToBox(box[0].x, box[0].y, list);

    return getPointsTranslatedToImage(width, height, screenWidth, screenHeight, translatedList, center);
}