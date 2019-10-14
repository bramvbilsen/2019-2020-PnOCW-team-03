import Slave from "./Slave";
import Client from "./Client";

function generateRandomColor(): string {
	return `rgb(${Math.round(Math.random() * 255)}, ${Math.round(
		Math.random() * 255
	)}, ${Math.round(Math.random() * 255)})`;
}

export default class Master extends Client {
	constructor() {
		super();
	}

	/********************/
	private slaves: Array<Slave> = [];

	public getSlaves(): Array<Slave> {
		return this.slaves;
	}

	public showRandomColorsOnSlaves() {
		let slaveColorCoding: { [key: string]: string } = {};
		this.slaves.forEach(slave => {
			slave.setColor(generateRandomColor());
			slaveColorCoding[slave.getID()] = slave.getColor();
		});
		socket.emit("change-slaves-bg-by-master", slaveColorCoding);
	}
}
