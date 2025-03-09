// ~/composables/socket.client.ts

import { ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

// Singleton pattern to ensure only one connection
const socketInstance = ref<Socket>();

export function useSocket() {
  if (!socketInstance.value) {
    socketInstance.value = io(
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
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
