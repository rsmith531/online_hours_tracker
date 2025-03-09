// ~/composables/socket.client.ts

import { ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

// Singleton pattern to ensure only one connection
const socketInstance = ref<Socket>();

export function useSocket() {
  if (!socketInstance.value) {
    const url = useRequestURL().origin;
    console.log(`[useSocket] creating socket at ${url}`)
    socketInstance.value = io(
      url,
      {
        // Enable automatic reconnection
        reconnection: true,
        // Try WebSocket first, fallback to polling if needed
        transports: ['websocket', 'polling'],
      }
    );
  }

  return socketInstance.value;
}
