import {ConnectionType} from "./types/ConnectionType";

class ConnectedUser {
  type: ConnectionType;
  id: string;

  constructor(connectionType: ConnectionType, id: string) {
    this.type = connectionType;
    this.id = id;
  }
}
