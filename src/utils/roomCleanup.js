import { get, ref, remove, set } from 'firebase/database';
import { database, getCurrentUserId } from '../config/firebase';

// How long to keep rooms before cleanup (in milliseconds)
const FINISHED_ROOM_MAX_AGE = 1 * 60 * 60 * 1000; // 1 hour for finished games
const STALE_ROOM_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours for any room (abandoned games)

/**
 * Archive a completed game's essential data (preserves drawing URLs)
 * and delete the room data to save space.
 *
 * This keeps the archived data lightweight while preserving
 * references to drawings stored in Firebase Storage.
 */
export async function archiveGameAndCleanup({ roomCode, players, drawings, numRounds }) {
  const userId = getCurrentUserId();
  if (!userId) {
    console.warn('Cannot archive game: not authenticated');
    return false;
  }

  try {
    // Create archive entry with essential data only
    const archiveData = {
      roomCode,
      completedAt: Date.now(),
      numRounds,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        totalScore: p.totalScore || 0,
        isHost: p.isHost || false,
      })),
      // Preserve drawing URLs so images remain accessible
      // Filter out drawings without URLs and handle missing round values
      drawings: Object.entries(drawings || {}).reduce((acc, [playerId, drawingData]) => {
        if (drawingData?.url) {
          acc[playerId] = {
            url: drawingData.url,
            // Default to 1 if round is missing (handles old/incomplete data)
            round: drawingData.round ?? 1,
          };
        }
        return acc;
      }, {}),
    };

    // Save to archives (indexed by timestamp for easy cleanup later if needed)
    const archiveId = `${Date.now()}_${roomCode}`;
    await set(ref(database, `archives/${archiveId}`), archiveData);

    // Delete the room data
    await remove(ref(database, `rooms/${roomCode}`));

    console.log(`Archived and cleaned up room: ${roomCode}`);
    return true;
  } catch (error) {
    console.error('Error archiving game:', error);
    return false;
  }
}

/**
 * Clean up stale rooms on app start.
 * Runs client-side since Cloud Functions require paid tier.
 *
 * SAFETY: Only deletes rooms that are clearly no longer in use:
 * - Finished games older than 1 hour (game is complete)
 * - Any room older than 24 hours with no activity (abandoned)
 *
 * Rooms that are "still in play" (lobby/drawing/rating/results with recent
 * activity) will NOT be deleted because they won't meet the age thresholds.
 *
 * Should be called once on app start.
 */
export async function cleanupStaleRooms() {
  const userId = getCurrentUserId();
  if (!userId) {
    // Not authenticated yet, skip cleanup
    return { cleaned: 0, archived: 0 };
  }

  try {
    const roomsRef = ref(database, 'rooms');
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
      return { cleaned: 0, archived: 0 };
    }

    const now = Date.now();
    const rooms = snapshot.val();
    let cleaned = 0;
    let archived = 0;

    for (const [roomCode, roomData] of Object.entries(rooms)) {
      const lastActivity = roomData.lastActivity || roomData.createdAt || 0;
      const age = now - lastActivity;

      // Only clean up rooms where the current user has permission
      // (user is host or a player in the room)
      const isHost = roomData.hostId === userId;
      const isPlayer = roomData.players && roomData.players[userId];
      const hasPermission = isHost || isPlayer;

      if (!hasPermission) {
        // Skip rooms we don't have permission to delete
        continue;
      }

      let shouldClean = false;
      let shouldArchive = false;

      // Finished games older than 1 hour - safe to clean (game is over)
      if (roomData.status === 'finished' && age > FINISHED_ROOM_MAX_AGE) {
        shouldClean = true;
        shouldArchive = true;
      }
      // Any room older than 24 hours - abandoned, safe to clean
      // (active games update lastActivity frequently, so they won't hit this)
      else if (age > STALE_ROOM_MAX_AGE) {
        shouldClean = true;
        shouldArchive = true;
      }

      if (shouldClean) {
        try {
          if (shouldArchive && roomData.drawings) {
            // Archive before deleting (preserves drawing URLs)
            await archiveGameAndCleanup({
              roomCode,
              players: Object.values(roomData.players || {}),
              drawings: roomData.drawings,
              numRounds: roomData.settings?.numRounds || 0,
            });
            archived++;
          } else {
            // No drawings to archive, just delete
            await remove(ref(database, `rooms/${roomCode}`));
          }
          cleaned++;
        } catch (error) {
          console.warn(`Failed to clean up room ${roomCode}:`, error);
        }
      }
    }

    if (cleaned > 0) {
      console.log(`Cleanup complete: ${cleaned} rooms cleaned, ${archived} archived`);
    }

    return { cleaned, archived };
  } catch (error) {
    console.warn('Error during room cleanup:', error);
    return { cleaned: 0, archived: 0 };
  }
}

/**
 * Clean up old archives to prevent unbounded growth.
 * Keeps archives for 30 days, then deletes them.
 * (Drawings in Storage remain - only archive metadata is deleted)
 */
export async function cleanupOldArchives() {
  const userId = getCurrentUserId();
  if (!userId) {
    return { cleaned: 0 };
  }

  try {
    const archivesRef = ref(database, 'archives');
    const snapshot = await get(archivesRef);

    if (!snapshot.exists()) {
      return { cleaned: 0 };
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const archives = snapshot.val();
    let cleaned = 0;

    for (const [archiveId, archiveData] of Object.entries(archives)) {
      if (archiveData.completedAt < thirtyDaysAgo) {
        try {
          await remove(ref(database, `archives/${archiveId}`));
          cleaned++;
        } catch (error) {
          console.warn(`Failed to clean up archive ${archiveId}:`, error);
        }
      }
    }

    if (cleaned > 0) {
      console.log(`Archive cleanup: ${cleaned} old archives removed`);
    }

    return { cleaned };
  } catch (error) {
    console.warn('Error during archive cleanup:', error);
    return { cleaned: 0 };
  }
}

/**
 * Run all cleanup tasks.
 * Call this on app start after authentication.
 */
export async function runCleanupTasks() {
  // Run cleanups in parallel
  const [roomResult, archiveResult] = await Promise.all([
    cleanupStaleRooms(),
    cleanupOldArchives(),
  ]);

  return {
    roomsCleaned: roomResult.cleaned,
    roomsArchived: roomResult.archived,
    archivesCleaned: archiveResult.cleaned,
  };
}
