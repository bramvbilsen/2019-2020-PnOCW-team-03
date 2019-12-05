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
    get masterID(): string {
        return this.master.id;
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
    get ids(): string[] {
        return this.connections.map(con => con.id);
    }

    add = (connection: socketio.Socket) => {
        this._connections = [...this._connections, connection];
        io.to(connection.id).emit(SharedEventTypes.NotifyOfTypeChange, {
            type:
                this.length === 1
                    ? ConnectionType.MASTER
                    : ConnectionType.SLAVE,
        });
        if (this.master) {
            this.notifyMasterOfSlaves();
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

                /* for (let i = 0; i < this._connections.length; i++) {
                    const element = this._connections[i];
                    
                    io.to(element.id).emit(
                        SharedEventTypes.NotifyOfTypeChange,{
                        type: i === 0 ? ConnectionType.MASTER : ConnectionType.SLAVE
                    });
                } */

                if (this._connections.length >= 0) {
                    io.to(this._connections[0].id).emit(
                        SharedEventTypes.NotifyOfTypeChange, {
                        type: ConnectionType.MASTER
                    });
                }

                /*
                io.emit(SharedEventTypes.NotifyOfTypeChange, {
                    type: ConnectionType.SLAVE
                }); */

            } else {
                this._connections.splice(index, 1);
            }
        });
        if (this.master) {
            this.notifyMasterOfSlaves();
        }
        console.log("Client disconnected: " + connectionToRemove.id);
        console.log("Total connected: " + this.length);
    };

    getSocketFromId(id: string) {
        for (let i = 0; i < this.connections.length; i++) {
            const con = this.connections[i];
            if (con.id === id) {
                return con;
            }
        }
        return;
    }

    changeMaster = (newMaster: socketio.Socket) => {
        console.log("Changing master to: " + newMaster.id);
        if (this._connections.length !== 0) {
            this.removeSocketFromConnectionsArray(newMaster);
            const oldMaster = this._connections.shift();
            this._connections.unshift(newMaster);
            this._connections.push(oldMaster);
            io.to(oldMaster.id).emit(SharedEventTypes.NotifyOfTypeChange, {
                type: ConnectionType.SLAVE,
            });
        } else {
            this._connections = [newMaster];
        }
        io.to(newMaster.id).emit(SharedEventTypes.NotifyOfTypeChange, {
            type: ConnectionType.MASTER,
        });
        this.notifyMasterOfSlaves();
    };

    private notifyMasterOfSlaves() {
        io.to(this.master.id).emit(MasterEventTypes.SlaveChanges, {
            slaves: this.slaveIDs,
        });
    }

    private removeSocketFromConnectionsArray(socket: socketio.Socket) {
        this._connections.forEach((connection, index) => {
            if (connection.id === socket.id) {
                this._connections.splice(index, 1);
            }
        });
    }
}
