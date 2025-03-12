// ~/server/plugins/socket.ts

// https://socket.io/how-to/use-with-nuxt
import type { NitroApp } from 'nitropack';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler, getRequestURL } from 'h3';
import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/cluster-adapter';
import { setupWorker } from '@socket.io/sticky';
import { useRequestURL } from 'nuxt/app';

const runtime = useRuntimeConfig();

let io: Server;

if (runtime.public.environment !== 'development') {
  try {
    console.log(
      `[socket] runtime environment was ${runtime.public.environment}, configuring socket for prod.`
    );
    // configure the socket to work with pm2 in prod
    const httpServer = createServer();
    // io = new Server(httpServer);
    io = new Server(Number(runtime.socketPort));

    console.log(`[socket] accepting connections at port ${Number(runtime.socketPort)}`)
    

    // @ts-expect-error I hate socket.io
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
  try {
    const engine = new Engine();
    io.bind(engine);

    io.on('connection', (socket) => {
      console.log(`[socket] connected client with id: ${socket.id}`);

      // Log connection details
      const handshake = socket.handshake;
      console.log('[socket] connection details:', {
        clientIP: handshake.address,
        origin: handshake.headers.origin,
        location: handshake.headers.location,
        urlPath: handshake.url,
        host: handshake.headers.host,
      });
      // Handle client disconnections
      socket.on('disconnect', (reason) => {
        console.log(`[socket] a client disconnected because ${reason}`);
    console.log('[socket] final connection stats:', {
      totalDuration: `${Date.now()- handshake.issued}ms`,
      lastTransport: socket.conn?.transport?.name
    });
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
  } catch (error) {
    console.error('[socket] error while initializing socket server: ', error);
  }
});

export function useIO() {
  console.log('[io] presence was requested')
  return io;
}
