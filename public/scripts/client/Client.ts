import { ConnectionType } from "../types/ConnectionType";
import { SharedEventTypes, SlaveEventTypes, MasterEventTypes } from "../types/SocketIOEvents"
import { generateRandomColor } from "../util/colors";

class Client {
	private _type: ConnectionType;
	private _slaves: Array<string> = [];
	private _socketIOEmitters: Array<SocketIOClient.Emitter> = [];
	private _socket: SocketIOClient.Socket;

	constructor() {
		console.log("new client!");
		this._socket = io.connect("http://localhost:3000");
		this._socket.on("connected", () => console.log("Connected!"));
		this._socket.on(SharedEventTypes.NotifyOfTypeChange, (data: { type: ConnectionType }) => {
			this._type = data.type;
			this._slaves = [];
			const socketIOEmittersForNewType: Array<SocketIOClient.Emitter> = [];
			if (this.type === ConnectionType.SLAVE) {
				socketIOEmittersForNewType.push(
					this._socket.on(SlaveEventTypes.ChangeBackground, this.changeBackground)
				);
			}
			else {
				socketIOEmittersForNewType.push(
					this._socket.on(MasterEventTypes.SlaveChanges, this.handleSlaveChanges)
				);
			}
			this.setNewSocketIOEmitters(socketIOEmittersForNewType);
		});
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
			console.warn("MASTER PERMISSION NEEDED TO CHANGE COLORS.\nNot executing command!");
			return;
		}
		let slaveColorCoding: { [key: string]: string } = {};
		this.slaves.forEach(slaveID => {
			slaveColorCoding[slaveID] = generateRandomColor();
		});
		this._socket.emit(MasterEventTypes.ChangeSlaveBackgrounds, slaveColorCoding);
	}

	private setNewSocketIOEmitters = (newEmitters: Array<SocketIOClient.Emitter>) => {
		this._socketIOEmitters = newEmitters;
	}

	private changeBackground = (data: { color: string }): void => {
		const page: JQuery<HTMLBodyElement> = $("#page");
		page.css("background-color", data.color);
	}

	private handleSlaveChanges = (data: { slaves: Array<string> }) => {
		this._slaves = data.slaves;
	}
}

export default Client;