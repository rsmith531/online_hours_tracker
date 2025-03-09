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
  } else {
    console.log(
      `[useSocket] already connected to socket with id ${socketInstance.value.id}`
    );
  }

  return socketInstance.value;
}
