import express from 'express';
import * as path from "path";

const app = express();
const port = 3000;
app.use(express.static(path.resolve(__dirname + "/static")))
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + "/static/html/index.html"));
    console.log(__dirname);
});
app.listen(port, err => {
    if (err) {
        return console.error(err);
    }
    return console.log(`server is listening on ${port}`);
});