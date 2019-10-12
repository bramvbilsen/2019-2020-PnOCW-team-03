import * as fs from "fs";


export default async function(dest: string, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(dest, buffer, "binary", (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}
