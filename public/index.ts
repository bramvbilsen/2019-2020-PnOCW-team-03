console.log("Init client!!!");

const socket = io.connect("http://localhost:3000");

let connected: boolean = true;

let slaveColorCoding: { [key: string]: string } = {};
let slaveIDs: Array<string> = [];

socket.on("connect", function (data: any) {
    console.log("connected!");
    connected = true;
});

interface ISlavesChange {
    slaves: Array<string>
}

socket.on("notify-master-of-slaves", (data: ISlavesChange) => {
    slaveIDs = data.slaves;
});

/*
    COLORS
*/

function assignRandomColorsToSalves() {
    function generateRandomColor(): string {
        return `rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`;
    }
    slaveColorCoding = {};
    slaveIDs.forEach((slaveID) => {
        slaveColorCoding[slaveID] = generateRandomColor()
    });
}

function showColorsOnSlaves() {
    socket.emit("change-slave-bg", slaveColorCoding);
}

/*
    ARROWS
*/

console.log("ARROWS !");
function showArrowNorthOnSlaves() {
    socket.emit("send-arrow-north");
}

function showArrowRightOnSlaves() {
    socket.emit("send-arrow-right");
}
