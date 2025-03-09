// ~/server/plugins/socket.ts

// https://socket.io/how-to/use-with-nuxt
import type { NitroApp } from 'nitropack';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler } from 'h3';

let io: Server;

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  io = new Server();

  io.bind(engine);

  io.on('connection', (socket) => {
    // Handle client disconnections
    socket.on('disconnect', () => {
    });
  });

  nitroApp.router.use(
    '/socket.io/',
    defineEventHandler({
      handler(event) {
        // @ts-expect-error this type error appears to be caused by something internal to the socket.io library
        engine.handleRequest(event.node.req, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          // @ts-expect-error private method and property
          engine.prepare(peer._internal.nodeReq);
          // @ts-expect-error private method
          engine.onWebSocket(
            // @ts-expect-error private property
            peer._internal.nodeReq,
            // @ts-expect-error private property
            peer._internal.nodeReq.socket,
            peer.websocket
          );
        },
      },
    })
  );
});

// Export io instance for use in API handlers
export function useIO() {
  //function to access the io instance.
  return io;
}
