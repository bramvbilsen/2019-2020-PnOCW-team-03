export default abstract class Client {
	socket: SocketIOClient.Socket;
	constructor(socket: SocketIOClient.Socket) {
		this.socket = socket;
	}

	public isConnected() {
		return this.socket.connected;
	}

	public getID() {
		return this.socket.id;
	}
}
