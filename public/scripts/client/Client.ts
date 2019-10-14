export default abstract class Client {
	socket: SocketIOClient.Socket;
	constructor() {
		this.socket = io.connect("http://localhost:3000");
	}

	public isConnected() {
		return this.socket.connected;
	}

	public getID() {
		return this.socket.id;
	}
}
