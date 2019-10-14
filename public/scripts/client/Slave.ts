import Master from "./Master";
import Client from "./Client";

export default class Slave extends Client {
	constructor(color: string, master: Master) {
		super();
		this.color = color;
		this.master = master;
	}

	private color: string;
	private master: Master;

	public getMaster(): Master {
		return this.master;
	}

	public getColor(): string {
		return this.color;
	}

	public setColor(color: string) {
		this.color = color;
	}
}
