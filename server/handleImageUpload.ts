import * as path from "path";
import { Request, Dictionary, Response } from "express-serve-static-core";

import binaryToImageFile from "../imageProcessing/binaryToImageFile";

export default (req: Request<Dictionary<string>>, res: Response) => {
    console.log("POSTED IMAGE");
    const imageFile = req.file;
    if (!imageFile || !/image\/(png|jpg|jpeg)/.test(imageFile.mimetype)) {
        console.log("BAD IMAGE");
        res.sendStatus(400);
    } else {
        const ext = imageFile.mimetype === "image/png" ? "png" : "jpg";
        const dest = path.resolve(__dirname + "/uploads/");
        const fileName = `image.${ext}`;
        binaryToImageFile(dest, fileName, imageFile.buffer)
            .then(() => {
                res.sendStatus(200);
            })
            .catch(err => {
                console.log("Failed to save image: " + err);
                res.sendStatus(500);
            });
    }
}