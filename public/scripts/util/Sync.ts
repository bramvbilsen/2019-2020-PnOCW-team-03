import { SharedEventTypes } from "../types/SocketIOEvents";
import env from "../../env/env";

// Based on https://github.com/calvinfo/socket-ntp/blob/master/client/ntp.js
// But rewitten to make it work with classes and typescript.
export default class Sync {
    private _offsets: number[] = [];
    private _socket: SocketIOClient.Socket;
    public avgTestResults: number[] = [];
    private _finishedTest: boolean = false;

    constructor(socket: SocketIOClient.Socket) {
        this._socket = socket;
        this._socket.on(SharedEventTypes.TimeSyncServer, this.onSync);
        setInterval(() => {
            this._socket.emit(SharedEventTypes.TimeSyncClient, {
                t0: Date.now(),
            });
        }, 1000);
    }

    get timeDiff() {
        return (
            this._offsets.reduce((a, b) => a + b, 0) / this._offsets.length || 0
        );
    }

    onSync = (data: { t1: number; t0: number }) => {
        // 1) Get the offset
        const diff = Date.now() - data.t1 + (Date.now() - data.t0) / 2;

        // 2) Push offset to offsets
        this._offsets.unshift(diff);

        // 3) Remove first in
        if (this._offsets.length > 10) this._offsets.pop();

        // 4) Post test results
        this.postTestResults(300);
    };

    private postTestResults(nbIterations: number) {
        if (this.avgTestResults.length <= nbIterations) {
            console.log(this.avgTestResults.length);
            this.avgTestResults.push(this.timeDiff);
        }
        else if (!this._finishedTest) {
            this._finishedTest = true;
            const stringifiedResults = JSON.stringify(this.avgTestResults);
            console.log(stringifiedResults);
            $.ajax({
                url: env.baseUrl + "/sync_test_result",
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                type: "POST",
                data: stringifiedResults,
                success: function (msg) {
                    if (msg != null) {
                        return msg.URL;
                    }
                }
            });
        }
    }
}

