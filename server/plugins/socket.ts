// ~/server/plugins/socket.ts

import type { NitroApp } from 'nitropack';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler } from 'h3';

const runtime = useRuntimeConfig();
const io = new Server();

console.log(
  `[socket] runtime environment was ${runtime.public.environment}, configuring socket for development.`
);

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();

  io.bind(engine);

  // create a namespace for this particular instance to avoid colliding with other tenants
  io.of(runtime.public.socketNamespace);

  io.on('connection', (socket) => {
    console.log(`[socketServer] sees new connection: ${socket.id}`);

    // Handle client disconnections
    socket.on('disconnect', (reason) => {
      console.log(`[socket] a client disconnected because ${reason}`);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error('[socket] server encountered an error');
    console.log(err.req); // the request object
    console.log(err.code); // the error code, for example 1
    console.log(err.message); // the error message, for example "Session ID unknown"
    console.log(err.context); // some additional error context
  });

  nitroApp.router.use(
    '/socket.io/',
    defineEventHandler({
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
          engine.onWebSocket(
            // @ts-expect-error private method and property
            peer._internal.nodeReq,
            // @ts-expect-error private method and property
            peer._internal.nodeReq.socket,
            peer.websocket
          );
        },
      },
    })
  );
});

export function getIO() {
  return io.of(runtime.public.socketNamespace);
}
