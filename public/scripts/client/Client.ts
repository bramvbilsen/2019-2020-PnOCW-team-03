import { ConnectionType } from "../types/ConnectionType";
import {
    SharedEventTypes,
    SlaveEventTypes,
    MasterEventTypes,
} from "../types/SocketIOEvents";
import { generateRandomColor } from "../util/colors";
import { IRGBAColor } from "../types/Color";
import env from "../../env/env";

class Client {
    private _type: ConnectionType;
    private _slaves: Array<string> = [];
    private _socketIOEmitters: Array<SocketIOClient.Emitter> = [];
    private _socket: SocketIOClient.Socket;
    private _delayWithServer: number;
    public onConnectionTypeChange: (connectionType: ConnectionType) => void;
    public DEBUG: boolean = false;
    /**
     * Color that the user wants to display on the slave.
     * Only applicable for masters.
     */
    public color: IRGBAColor = {
        r: 255,
        g: 70,
        b: 181,
        a: 100,
    };

    constructor(args: {
        onConnectionTypeChange: (connectionType: ConnectionType) => void;
    }) {
        console.log("new client!");
        this.onConnectionTypeChange = args.onConnectionTypeChange;
        this._socket = io.connect(env.baseUrl);
        /* CONNECTION */
        this._socket.on("connected", () => console.log("Connected!"));
        /* NOTIFY MASTER OF CONNECTION */
        this._socket.on(
            SharedEventTypes.NotifyOfTypeChange,
            (data: { type: ConnectionType }) => {
                this._type = data.type;
                this._slaves = [];
                const socketIOEmittersForNewType: Array<SocketIOClient.Emitter> = [];
                if (this.type === ConnectionType.SLAVE) {
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            SlaveEventTypes.ChangeBackground,
                            this.changeBackground
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayArrowUp,
                            this.displayArrowUp
                        ),
                        this._socket.on(
                            SlaveEventTypes.DisplayArrowRight,
                            this.displayArrowRight
                        ),
                        this._socket.on(
                            SlaveEventTypes.ChangeOrientationColors,
                            this.displayOrientationColors
                        ),
                        this._socket.on(
                            SlaveEventTypes.SetCounterEvent,
                            this.startCounterEvent
                        )
                    );
                } else {
                    socketIOEmittersForNewType.push(
                        this._socket.on(
                            MasterEventTypes.SlaveChanges,
                            this.handleSlaveChanges
                        )
                    );
                }
                this.setNewSocketIOEmitters(socketIOEmittersForNewType);
                this.onConnectionTypeChange(this.type);
            }
        );
        // Save the delay time with server
        var xmlHttp: XMLHttpRequest;
        var st = this.srvTime(xmlHttp);
        var serverSeconds = new Date(st).getSeconds();
        var localSeconds = new Date().getSeconds();
        this._delayWithServer = localSeconds - serverSeconds;
        console.log(
            this._delayWithServer + " seconds difference with the server"
        );
    }

    /**
     * @returns `ConnectionType.MASTER` if client is master.
     * @returns `ConnectionType.SLAVE` if client is slave.
     */
    get type(): ConnectionType {
        return this._type;
    }

    /**
     * @returns an array the slave IDs if master.
     * @returns an empty array if slave.
     */
    get slaves(): Array<string> {
        return this._slaves;
    }

    /**
     * @returns wheter current client is connected with socketIO connection.
     */
    get connected(): boolean {
        return this._socket.connected;
    }

    /**
     * @returns the ID of the socket; matches the server ID and is set when we're connected,
     * 	and cleared when we're disconnected
     */
    get id(): string {
        return this._socket.id;
    }

    /**
     * Sends a request to the server to change the background colors of the slaves.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showColorsOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        let slaveColorCoding: { [slaveID: string]: string } = {};
        this.slaves.forEach(slaveID => {
            slaveColorCoding[slaveID] = generateRandomColor();
        });
        this._socket.emit(
            MasterEventTypes.ChangeSlaveBackgrounds,
            slaveColorCoding
        );
        return slaveColorCoding;
    };

    /**
     * Sends a request to the server to change the background color of the slave.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showColorOnSlave = (slaveId: string) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        const { a, ...color } = this.color;
        this._socket.emit(MasterEventTypes.ChangeSlaveBackground, {
            slaveId,
            color,
        });
    };

    /**
     * Sends a request to the server to change the orientation colors of the slave.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showOrientationColorsOnSlave = (slaveId: string) => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
            return;
        }
        // TODO:  colors are not necessary any more.
        this._socket.emit(MasterEventTypes.DisplaySlaveOrientationColors, {
            slaveId,
            leftTop: { r: 0, g: 0, b: 0 },
            rightTop: { r: 0, g: 0, b: 0 },
            leftBottom: { r: 0, g: 0, b: 0 },
            rightBottom: { r: 0, g: 0, b: 0 },
        });
    };

    /**
     * Sends a request commanding all slaves to display an arrow pointing upwards.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showArrowsUpOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO DISPLAY ARROWS.\nNot executing command!"
            );
            return;
        }
        this._socket.emit(MasterEventTypes.SendArrowsUp);
    };

    /**
     * Sends a request commanding all slaves to display an arrow pointing to the right.
     * This is only permitted if the current `this.type === ConnectionType.MASTER`
     * 	and will thus not send the server request if this is not the case.
     */
    public showArrowsRightOnSlaves = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO DISPLAY ARROWS.\nNot executing command!"
            );
            return;
        }
        this._socket.emit(MasterEventTypes.SendArrowsRight);
    };

    private setNewSocketIOEmitters = (
        newEmitters: Array<SocketIOClient.Emitter>
    ) => {
        this._socketIOEmitters = newEmitters;
    };

    private changeBackground = (data: {
        color: { r: number; g: number; b: number };
    }): void => {
        const slaveHTML: JQuery<HTMLBodyElement> = $("#slave");
        slaveHTML.css(
            "background-color",
            `rgb(${data.color.r}, ${data.color.g}, ${data.color.b})`
        );
    };

    private displayOrientationColors = (data: {
        leftTop: { r: string; g: string; b: string };
        rightTop: { r: string; g: string; b: string };
        leftBottom: { r: string; g: string; b: string };
        rightBottom: { r: string; g: string; b: string };
    }): void => {
        console.log("Displaying orientation colors");
        const orientationElem: JQuery<HTMLDivElement> = $(
            "#orientation-colors"
        );
        orientationElem.toggle();
    };

    private displayArrowUp = (): void => {
        //$('#arrowImg').remove('<img id="arrowRight" src="../img/arrowRight.png" />');
        $("#arrowImg").replaceWith(
            '<img id="arrowUp" src="../img/arrowUp.png" />'
        );
    };

    private displayArrowRight = (): void => {
        $("#arrowImg").replaceWith(
            '<img id="arrowRight" src="../img/arrowRight.png" />'
        );
    };

    /**
     * Emit to each slave the starttime of the counter (10 seconds ahead from now).
     * Each slave gets the server time plus or minus its own delay.
     */
    public notifySlavesOfStartTimeCounter = () => {
        if (this.type === ConnectionType.SLAVE) {
            console.warn(
                "MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!"
            );
        } else {
            let startTime = new Date().getTime() + 10000;
            let slaveIds = this.slaves;
            console.log("Emitting counter event");
            this._socket.emit(MasterEventTypes.NotifySlavesOfStartTimeCounter, {
                startTime,
                slaveIds,
            });
        }
    };

    private startCounterEvent = (msg: { startTime: number }): void => {
        console.log("STARTING COUNTER In FRONTEND");
        let { startTime } = msg;
        startTime += this._delayWithServer;
        const eta_ms = startTime - Date.now();
        setTimeout(function() {
            const elevenseconds = 11000;
            const enddate = new Date(startTime + elevenseconds);
            countdown(enddate.getTime());
        }, eta_ms);

        function countdown(endDate: number) {
            var timer = setInterval(function() {
                let now = new Date().getTime();
                var t = Math.floor(((endDate - now) % (1000 * 60)) / 1000);

                if (t > 0) {
                    document.getElementById(
                        "countdown"
                    ).innerHTML = t.toString();
                } else {
                    document.getElementById("countdown").innerHTML = "Tadaaaaa";
                    clearinterval();
                }
            }, 1);
            function clearinterval() {
                clearInterval(timer);
            }
        }
    };

    private handleSlaveChanges = (data: { slaves: Array<string> }) => {
        this._slaves = data.slaves;
    };

    private srvTime = (xmlHttp: XMLHttpRequest) => {
        try {
            //FF, Opera, Safari, Chrome
            xmlHttp = new XMLHttpRequest();
        } catch (err1) {
            //IE
            try {
                xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (err2) {
                try {
                    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (eerr3) {
                    //AJAX not supported, use CPU time.
                    alert("AJAX not supported");
                }
            }
        }
        xmlHttp.open("HEAD", window.location.href.toString(), false);
        xmlHttp.setRequestHeader("Content-Type", "text/html");
        xmlHttp.send("");
        return xmlHttp.getResponseHeader("Date");
    };
}

export default Client;
