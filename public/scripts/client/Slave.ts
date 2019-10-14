import Master from "./Master";
import Client from "./Client";

export default class Slave extends Client {
	constructor(master: Master) {
		super();
		this.color = "rgb(255,255,255)";  // white
		this.master = master;
	}

	/********************/
	private color: string;

	public getColor(): string {
		return this.color;
	}

	public setColor(color: string) {
		this.color = color;
	}

	/********************/
	private master: Master;

	public getMaster(): Master {
		return this.master;
	}

	
}
