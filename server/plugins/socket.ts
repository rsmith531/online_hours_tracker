// ~/server/plugins/socket.ts

// https://socket.io/how-to/use-with-nuxt
import type { NitroApp } from 'nitropack';
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler, getRequestURL } from 'h3';
import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/cluster-adapter';
import { setupWorker } from '@socket.io/sticky';

let io: Server;

export default defineNitroPlugin((nitroApp: NitroApp) => {
  try {
    const engine = new Engine();
    const httpServer = createServer();
    io = new Server(httpServer);

    // if (not on localhost) {
    //   // @ts-expect-error I hate socket.io
    //   io.adapter(createAdapter());
    //   setupWorker(io);
    // }
    io.bind(engine);

    io.on('connection', (socket) => {
      console.log(`[socket] connected client with id: ${socket.id}`);
      // Handle client disconnections
      socket.on('disconnect', (reason) => {
        console.log(`[socket] a client disconnected because ${reason}`);
      });
    });

    io.engine.on('connection_error', (err) => {
      console.log('[socket] server encountered an error');
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

// Export io instance for use in API handlers
export function useIO() {
  //function to access the io instance.
  return io;
}
