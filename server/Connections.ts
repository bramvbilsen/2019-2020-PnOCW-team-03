import { io } from "../index";
import socketio from "socket.io";
import { SharedEventTypes } from "../types/SocketIOEvents";
import { ConnectionType } from "../types/ConnectionsType";

export default class Connections {
	private _connections: Array<socketio.Socket> = [];

	get length(): number {
		return this._connections.length;
	}

	get master(): socketio.Socket {
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

	add = (slave: socketio.Socket) => {
		this._connections = [...this._connections, slave];
		io.to(slave.id).emit(SharedEventTypes.NotifyOfTypeChange, {
			type:
				this.length === 0 ? ConnectionType.MASTER : ConnectionType.SLAVE
		});
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
	};

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
