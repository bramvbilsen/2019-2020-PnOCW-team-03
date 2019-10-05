import express from 'express';
import * as path from "path";

const app = express();
const port = 3000;

const staticFolder = path.resolve(__dirname + "/../public/build");
const htmlFolder = path.resolve(staticFolder + "/html");

app.use(express.static(staticFolder));
app.get('/', (req, res) => {
    res.sendFile(path.resolve(htmlFolder + "/index.html"));
});
app.listen(port, err => {
    if (err) {
        return console.error(err);
    }
    return console.log(`dag stuk stront, welom op port ${port}`);
});