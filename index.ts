import express from 'express';
import * as path from "path";

const app = express();
const port = 3000;
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../static/index.html"));
});
app.listen(port, err => {
    if (err) {
        return console.error(err);
    }
    return console.log(`dag stuk stront, welom op port ${port}`);
});