import * as fs from "fs";
import * as path from "path";

/**
 * Turns a binary into a new image file.
 * @param dest Location on the computer where the new image should be written to.
 * @param fileName The name of the new image.
 * @param buffer The buffer to use.
 */
export default async function(
	dest: string,
	fileName: string,
	buffer: Buffer
): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.mkdir(dest, { recursive: true }, err => {
			fs.writeFile(path.join(dest, fileName), buffer, "binary", err => {
				if (err) {
					reject(err);
				}
				resolve();
			});
		});
	});
}
