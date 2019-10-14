import Master from "./Master";
import Client from "./Client";
import { SlaveEventTypes } from "../types/SocketIOEvents";

export default class Slave extends Client {
	constructor(socket: SocketIOClient.Socket) {
		super(socket);
		socket.on(
			SlaveEventTypes.ChangeBackground,
			(data: { color: string }) => {
				const page: JQuery<HTMLBodyElement> = $("#page");
				page.css("background-color", data.color);
			}
		);
	}

}
