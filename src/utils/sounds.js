import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Sound file references
const SOUND_FILES = {
  tap: require('../../assets/sounds/tap.mp3'),
  success: require('../../assets/sounds/success.mp3'),
  clockTick: require('../../assets/sounds/clock-tick.wav'),
  roundComplete: require('../../assets/sounds/round-complete.wav'),
  celebration: require('../../assets/sounds/celebration.mp3'),
};

// Pre-loaded audio players (persisted to prevent garbage collection)
const players = {};

let isMuted = false;
let isInitialized = false;

// Initialize the audio system and preload all sounds
export async function initSounds() {
  if (isInitialized) return;

  try {
    // Set audio mode for game sounds
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });

    // Load mute preference
    const mutedPref = await AsyncStorage.getItem('soundMuted');
    isMuted = mutedPref === 'true';

    // Pre-load all sounds
    for (const [key, source] of Object.entries(SOUND_FILES)) {
      try {
        players[key] = createAudioPlayer(source);
      } catch (e) {
        console.warn(`Failed to preload sound ${key}:`, e);
      }
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize sounds:', error);
  }
}

// Get current mute state
export function isSoundMuted() {
  return isMuted;
}

// Toggle mute state
export async function toggleMute() {
  isMuted = !isMuted;
  try {
    await AsyncStorage.setItem('soundMuted', isMuted.toString());
  } catch (error) {
    console.warn('Failed to save mute preference:', error);
  }
  return isMuted;
}

// Set mute state explicitly
export async function setMuted(muted) {
  isMuted = muted;
  try {
    await AsyncStorage.setItem('soundMuted', isMuted.toString());
  } catch (error) {
    console.warn('Failed to save mute preference:', error);
  }
}

// Play a preloaded sound with optional duration limit
function playSound(soundKey, volume = 1.0, durationMs = null) {
  if (isMuted) return;

  try {
    const player = players[soundKey];
    if (!player) {
      console.warn(`Sound ${soundKey} not loaded`);
      return;
    }

    // Reset to beginning and set volume
    player.seekTo(0);
    player.volume = volume;
    player.play();

    // If duration is specified, pause the sound after that time
    if (durationMs) {
      setTimeout(() => {
        try {
          player.pause();
        } catch (_e) {
          // Ignore errors
        }
      }, durationMs);
    }
  } catch (error) {
    // Silently fail - sounds are non-critical
    console.warn(`Failed to play sound ${soundKey}:`, error);
  }
}

// ============ Sound Effect Functions ============

// Light tap sound for button presses
export function playTap() {
  playSound('tap', 0.5);
}

// Success chime for completed actions
export function playSuccess() {
  playSound('success', 0.6);
}

// Clock tick for last 10 seconds countdown - plays one tick
export function playClockTick() {
  playSound('clockTick', 0.6, 900);
}

// Round complete chime
export function playRoundComplete() {
  playSound('roundComplete', 0.7);
}

// Winner celebration fanfare
export function playCelebration() {
  playSound('celebration', 0.8);
}
