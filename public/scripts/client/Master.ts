import Slave from "./Slave";
import Client from "./Client";
import { MasterEventTypes } from "../types/SocketIOEvents";

function generateRandomColor() {
	return `rgb(${Math.random() * 255}, ${Math.random() *
		255}, ${Math.random() * 255})`;
}

export default class Master extends Client {
	constructor(socket: SocketIOClient.Socket) {
		super(socket);
		socket.on(
			MasterEventTypes.SlaveChanges,
			(data: { slaves: Array<string> }) => {
				this.slaves = data.slaves;
			}
		);
	}

	private slaves: Array<string> = [];

	public getSlaves(): Array<string> {
		return this.slaves;
	}

	public showColorsOnSlaves() {
		let slaveColorCoding: { [key: string]: string } = {};
		this.slaves.forEach(slaveID => {
			slaveColorCoding[slaveID] = generateRandomColor();
		});
<<<<<<< HEAD
		socket.emit(MasterEventTypes.ChangeSlaveBackgrounds, slaveColorCoding);
=======
		socket.emit("change-slaves-bg-by-master", slaveColorCoding);
>>>>>>> a7fd95d825f210ecb5fc8210e6f81718c083c20f
	}
}
