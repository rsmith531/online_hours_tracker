// ~/composables/socket.client.ts

import { ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

// Singleton pattern to ensure only one connection
const socketInstance = ref<Socket>();

export function useSocket() {
  if (!socketInstance.value) {
    const url = useRequestURL().origin;
    console.log(`[useSocket] connecting to socket at ${url}`);
    socketInstance.value = io(url, {
      // Enable automatic reconnection
      reconnection: true,

      // can't use http long-polling with pm2
      // https://socket.io/docs/v4/pm2/
      transports: ['websocket'],
    });

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
