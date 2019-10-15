import { io } from "../index";
import socketio from "socket.io";
import { SharedEventTypes, MasterEventTypes } from "../types/SocketIOEvents";
import { ConnectionType } from "../types/ConnectionsType";

export default class Connections {
	private _connections: Array<socketio.Socket> = [];

	get length(): number {
		return this._connections.length;
	}

	get master(): socketio.Socket | undefined {
		return this._connections[0];
	}
	get slaves(): Array<socketio.Socket> {
		return this._connections.slice(1);
	}
	get slaveIDs(): Array<string> {
		return this.slaves.map(slave => slave.id);
	}
	get connections(): Array<socketio.Socket> {
		return this._connections;
	}

	add = (connection: socketio.Socket) => {
		this._connections = [...this._connections, connection];
		io.to(connection.id).emit(SharedEventTypes.NotifyOfTypeChange, {
			type:
				this.length === 1 ? ConnectionType.MASTER : ConnectionType.SLAVE
		});
		if (this.master) {
			io.to(this.master.id).emit(MasterEventTypes.SlaveChanges, {
				slaves: this.slaveIDs
			});
		}
		console.log("New connection: " + connection.id);
		console.log("Total connected: " + this.length);
	};

	remove = (connectionToRemove: socketio.Socket) => {
		this._connections.forEach((connection, index) => {
			if (connection.id !== connectionToRemove.id) {
				return;
			}
			if (this.master.id === connectionToRemove.id) {
				this._connections.shift();
				io.emit(SharedEventTypes.NotifyOfTypeChange, {
					type: ConnectionType.MASTER
				});
			} else {
				this._connections.splice(index, 1);
			}
		});
		if (this.master) {
			io.to(this.master.id).emit(MasterEventTypes.SlaveChanges, {
				slaves: this.slaveIDs
			});
		}
		console.log("Client disconnected: " + connectionToRemove.id);
		console.log("Total connected: " + this.length);
	};

	// TODO: New master should be notified of slaves.
	changeMaster = (newMaster: socketio.Socket) => {
		if (this._connections.length !== 0) {
			let oldMaster = this._connections.shift();
			this._connections.unshift(newMaster, oldMaster);
			io.to(oldMaster.id).emit(SharedEventTypes.NotifyOfTypeChange, {
				type: ConnectionType.SLAVE
			});
		} else {
			this._connections = [newMaster];
		}
		io.to(newMaster.id).emit(SharedEventTypes.NotifyOfTypeChange, {
			type: ConnectionType.MASTER
		});
	};
}
