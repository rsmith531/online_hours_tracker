import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { Server } from "socket.io";
import { defineEventHandler } from "h3";

let io: Server;

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  io = new Server();

  io.bind(engine);

  io.on("connection", (socket) => {
    console.log(`[socketServer] sees new connection: ${socket.id}`)
  });

  nitroApp.router.use("/socket.io/", defineEventHandler({
    handler(event) {
        // @ts-expect-error fuck you
      engine.handleRequest(event.node.req, event.node.res);
      event._handled = true;
    },
    websocket: {
      open(peer) {
        // @ts-expect-error private method and property
        engine.prepare(peer._internal.nodeReq);
        // @ts-expect-error private method and property
        engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket);
      }
    }
  }));
});

export function getIO() {
    return io;
}