// ~/composables/socket.client.ts

import { ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

// Singleton pattern to ensure only one connection
const socketInstance = ref<Socket>();

export function useSocket() {
  if (!socketInstance.value) {
    const runtime = useRuntimeConfig();
    const url = useRequestURL().origin;
    console.log(`[useSocket] creating socket at ${runtime.public.socketNamespace}`);
    // connect to the namespace this instance is broadcasting on
    socketInstance.value = io(runtime.public.socketNamespace, {
      reconnection: true,
      transports: ['websocket'],
    });

    // Handle connections
    // socketInstance.value.on('connect', () => {
    //   console.log(`[socket] connected to namespace: ${runtime.public.socketNamespace}`);
    // });

    // Handle disconnections
    socketInstance.value.on('disconnect', () => {
      console.log('[socket] disconnected');
    });

    // Handle reconnections
    socketInstance.value.on('reconnect', () => {
      console.log('[socket] reconnected');
    });

    socketInstance.value.on('connect_error', (error) => {
      console.error('[socket] connection error: ', error);
    });

    socketInstance.value.on('connect_timeout', (timeout) => {
      console.error('[socket] connection timeout: ', timeout);
    });
  } else {
    console.log(
      `[useSocket] already connected to socket with id ${socketInstance.value.id}`
    );
  }

  return socketInstance.value;
}
