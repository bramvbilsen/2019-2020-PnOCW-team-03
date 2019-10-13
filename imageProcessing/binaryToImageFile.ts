import * as fs from "fs";
import * as path from "path";

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
