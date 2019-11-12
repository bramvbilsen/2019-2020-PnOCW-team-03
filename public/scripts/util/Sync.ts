import { SharedEventTypes } from "../types/SocketIOEvents";

// Based on https://github.com/calvinfo/socket-ntp/blob/master/client/ntp.js
// But rewitten to make it work with classes and typescript.
export default class Sync {
    private _offsets: number[] = [];
    private _socket: SocketIOClient.Socket;

    constructor(socket: SocketIOClient.Socket) {
        this._socket = socket;
        this._socket.on(SharedEventTypes.TimeSyncServer, this.onSync);
        setInterval(() => {
            this.sync();
        }, 1000);
    }

    get timeDiff() {
        return (
            this._offsets.reduce((a, b) => a + b, 0) / this._offsets.length || 0
        );
    }

    onSync = (data: { t1: number; t0: number }) => {
        const diff = Date.now() - data.t1 + (Date.now() - data.t0) / 2;

        this._offsets.unshift(diff);

        if (this._offsets.length > 10) this._offsets.pop();
    };

    sync = () => {
        this._socket.emit(SharedEventTypes.TimeSyncClient, {
            t0: Date.now(),
        });
    };
}
