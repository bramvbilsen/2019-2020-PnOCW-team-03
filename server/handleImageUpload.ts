import * as path from "path";
import { Request, Dictionary, Response } from "express-serve-static-core";

import binaryToImageFile from "../imageProcessing/binaryToImageFile";

export default (req: Request<Dictionary<string>>, res: Response) => {
    console.log("POSTED IMAGE");
    const imageFile = req.file;
    if (
        !imageFile ||
        imageFile.mimetype !== "image/png" ||
        !req.body ||
        !req.body["slaveId"]
    ) {
        console.log("BAD IMAGE: expected .png file");
        res.sendStatus(400);
    } else {
        const dest = path.resolve(__dirname + "/uploads/slaves/");
        const slaveId = req.body["slaveId"];
        const fileName = `${slaveId}.png`;
        binaryToImageFile(dest, fileName, imageFile.buffer)
            .then(() => {
                res.status(200).send({
                    imgPath: `/slave_images/${slaveId}.png`,
                });
            })
            .catch(err => {
                console.log("Failed to save image: " + err);
                res.sendStatus(500);
            });
    }
};
