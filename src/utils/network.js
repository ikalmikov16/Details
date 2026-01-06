import { get, onValue, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { database } from '../config/firebase';

/**
 * Hook to monitor Firebase connection status
 * Returns { isConnected, isChecking }
 *
 * Uses a debounce to prevent brief disconnection flashes on app start
 */
export function useNetworkStatus() {
  // Start assuming we're connected to prevent flash
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const disconnectTimeoutRef = useRef(null);
  const hasEverConnectedRef = useRef(false);

  useEffect(() => {
    // Firebase provides a special .info/connected path
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;

      // Clear any pending disconnect timeout
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }

      if (connected) {
        // Connected - update immediately
        hasEverConnectedRef.current = true;
        setIsConnected(true);
        setIsChecking(false);
      } else {
        // Disconnected - but wait a moment before showing offline UI
        // This prevents the flash on app startup
        if (!hasEverConnectedRef.current) {
          // Never connected yet - give it more time (first load)
          disconnectTimeoutRef.current = setTimeout(() => {
            setIsConnected(false);
            setIsChecking(false);
          }, 2000); // Wait 2 seconds on first load
        } else {
          // Was connected before - show offline faster
          disconnectTimeoutRef.current = setTimeout(() => {
            setIsConnected(false);
            setIsChecking(false);
          }, 500); // Wait 0.5 seconds for reconnection attempts
        }
      }
    });

    // Use the unsubscribe function returned by onValue instead of off()
    return () => {
      unsubscribe();
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, []);

  return { isConnected, isChecking };
}

/**
 * Check if a room exists and is valid
 * Uses get() for a one-time read instead of onValue listener
 */
export async function checkRoomExists(roomCode) {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    return snapshot.exists();
  } catch {
    return false;
  }
}
