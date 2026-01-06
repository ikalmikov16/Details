import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// Check if sharing is available on this device
export async function isSharingAvailable() {
  return await Sharing.isAvailableAsync();
}

// Share text content (room codes, messages)
export async function shareText(message, title = 'Drawing Game') {
  try {
    if (Platform.OS === 'web') {
      // Web uses navigator.share or clipboard
      if (navigator.share) {
        await navigator.share({ title, text: message });
      } else {
        await navigator.clipboard.writeText(message);
        return { success: true, copied: true };
      }
    } else {
      // Native uses Share API
      const result = await Share.share({
        message,
        title,
      });
      return { success: result.action !== Share.dismissedAction };
    }
    return { success: true };
  } catch (error) {
    console.warn('Error sharing text:', error);
    return { success: false, error };
  }
}

// Share room code with a formatted message
export async function shareRoomCode(roomCode) {
  const message = `🎨 Join my Drawing Game!\n\nRoom Code: ${roomCode}\n\nDownload the app and enter this code to play with me!`;
  return shareText(message, 'Join My Drawing Game');
}

// Capture a view as an image and share it
export async function captureAndShare(viewRef, options = {}) {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Sharing not available on this device' };
    }

    // Capture the view as a temporary file
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      ...options,
    });

    // Share the captured image
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Results',
    });

    return { success: true };
  } catch (error) {
    console.warn('Error capturing and sharing:', error);
    return { success: false, error };
  }
}

// Share results as text (fallback when image sharing isn't available)
export async function shareResultsAsText(players, numRounds, isMultiplayer = false) {
  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

  let message = `🎨 Drawing Game Results!\n\n`;
  message += `🏆 Final Standings:\n`;

  sortedPlayers.forEach((player, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    message += `${medal} ${player.name}: ${player.totalScore || 0} pts\n`;
  });

  message += `\n📊 ${numRounds} rounds played`;
  message += isMultiplayer ? ' • Multiplayer' : ' • Single Device';
  message += `\n\n🎮 Play Drawing Game!`;

  return shareText(message, 'Drawing Game Results');
}
