import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off, Database } from 'firebase/database';
import { getDb, Game } from '../lib/firebase'; // Corrected import path

export function useGameRealtimeState(gameCode: string | null): { gameData: Game | null; error: Error | null; loading: boolean } {
  const [gameData, setGameData] = useState<Game | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null); // Ref to hold unsubscribe function

  useEffect(() => {
    // Clear previous listener if gameCode changes
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      console.log(`Unsubscribed from previous game listener due to gameCode change.`);
    }

    if (!gameCode) {
      setLoading(false);
      setGameData(null);
      // Optionally set an error if gameCode is expected but missing
      // setError(new Error("Game code is missing"));
      return;
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component
    setLoading(true);
    setError(null);
    setGameData(null); // Reset game data on new gameCode

    const setupListener = async () => {
      try {
        const db = await getDb();
        if (!db) {
          if (isMounted) {
            setError(new Error("Database instance not available."));
            setLoading(false);
          }
          return;
        }
        const dbRef = ref(db, `game/${gameCode}`);
        console.log(`[useGameRealtimeState] Setting up listener for game: ${gameCode}`);

        unsubscribeRef.current = onValue(dbRef, (snapshot) => {
          if (!isMounted) return; // Don't update state if unmounted

          if (snapshot.exists()) {
            console.log(`[useGameRealtimeState] Data received for game: ${gameCode}`, snapshot.val());
            setGameData(snapshot.val() as Game);
            setError(null);
          } else {
            console.warn(`[useGameRealtimeState] Game with code ${gameCode} not found or removed.`);
            setGameData(null);
            setError(new Error(`Game with code ${gameCode} not found.`));
          }
          setLoading(false);
        }, (err) => {
          if (!isMounted) return; // Don't update state if unmounted
          console.error(`[useGameRealtimeState] Firebase listener error for game ${gameCode}:`, err);
          setError(err as Error);
          setGameData(null);
          setLoading(false);
        });

      } catch (err) {
         if (isMounted) {
           console.error("[useGameRealtimeState] Error setting up Firebase listener:", err);
           setError(err as Error);
           setLoading(false);
         }
      }
    };

    setupListener();

    // Cleanup function
    return () => {
      isMounted = false; // Mark as unmounted
      if (unsubscribeRef.current) {
        console.log(`[useGameRealtimeState] Unsubscribing from game ${gameCode}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [gameCode]); // Re-run effect ONLY if gameCode changes

  return { gameData, error, loading };
} 