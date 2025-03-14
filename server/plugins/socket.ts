import type { NitroApp } from 'nitropack';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler } from 'h3';
import { createAdapter } from '@socket.io/cluster-adapter';
import { setupWorker } from '@socket.io/sticky';
import { createServer } from 'node:http';

const runtime = useRuntimeConfig();
let io: Server;

if (runtime.public.environment !== 'development') {
  try {
    console.log(
      `[socket] runtime environment was ${runtime.public.environment}, configuring socket for prod.`
    );
    // configure the socket to work with pm2 in prod
    const httpServer = createServer();
    io = new Server(httpServer);

    // allow socket packets to be broadcast to all clients regardless of node they are connected to
    io.adapter(createAdapter());

    // enable sticky sessions so that requests from a client always go back to the original node it opened a socket with
    setupWorker(io);
  } catch (error) {
    console.error(
      '[socket] encountered an error while configuring for prod: ',
      error
    );
  }
} else {
  try {
    console.log(
      `[socket] runtime environment was ${runtime.public.environment}, configuring socket for development.`
    );
    // configure the socket to work in dev
    io = new Server();
  } catch (error) {
    console.error(
      '[socket] encountered an error while configuring for dev: ',
      error
    );
  }
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();

  io.bind(engine);

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
  return io;
}
