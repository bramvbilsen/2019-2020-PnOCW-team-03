console.log("Init client");

const socket = io.connect("http://localhost:3000");

let connected: boolean = false;

let slaveColorCoding = {};
let slaveIDs: Array<string> = [];

socket.on("connect", function (data) {
    console.log("connected!");
    connected = true;
});

interface ISlavesChange {
    slaves: Array<string>
}

socket.on("notify-master-of-slaves", (data: ISlavesChange) => {
    slaveIDs = data.slaves;
});

function assignRandomColorsToSalves() {
    function generateRandomColor() {
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