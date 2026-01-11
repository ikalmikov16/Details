/**
 * TopicService - Manages drawing topics with Firebase sync and local caching
 *
 * Features:
 * - Fetches topics from Firebase Realtime Database
 * - Caches topics locally in AsyncStorage
 * - Falls back to hardcoded topics if offline
 * - Supports themed topic selection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, ref } from 'firebase/database';
import { database } from '../config/firebase';
import { FALLBACK_TOPICS, FALLBACK_THEMES } from '../data/topics';

const CACHE_KEY = '@topics_cache';
const CACHE_VERSION_KEY = '@topics_version';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for fast access
let cachedTopics = null;
let cachedThemes = null;
let lastUsedTopic = '';

/**
 * Initialize the topic service - call on app start
 */
export async function initTopicService() {
  try {
    // Try to load from local cache first (fast)
    await loadFromCache();

    // Then fetch from Firebase in background (fresh data)
    fetchFromFirebase().catch((err) => {
      console.warn('Background topic fetch failed:', err.message);
    });
  } catch (error) {
    console.warn('Topic service init failed, using fallback:', error.message);
    loadFallbackTopics();
  }
}

/**
 * Load topics from AsyncStorage cache
 */
async function loadFromCache() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { themes, timestamp } = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        cachedThemes = themes;
        cachedTopics = flattenTopics(themes);
        return true;
      }
    }
  } catch (error) {
    console.warn('Failed to load topics from cache:', error.message);
  }

  // Use fallback if no valid cache
  loadFallbackTopics();
  return false;
}

/**
 * Fetch topics from Firebase and update cache
 */
async function fetchFromFirebase() {
  try {
    const topicsRef = ref(database, 'topics');
    const snapshot = await get(topicsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const serverVersion = data.version || 1;

      // Check if we need to update
      const localVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);

      if (!localVersion || parseInt(localVersion) < serverVersion) {
        // Update cache
        cachedThemes = data.themes;
        cachedTopics = flattenTopics(data.themes);

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            themes: data.themes,
            timestamp: Date.now(),
          })
        );
        await AsyncStorage.setItem(CACHE_VERSION_KEY, serverVersion.toString());

        console.log('Topics updated from Firebase, version:', serverVersion);
      }
    }
  } catch (error) {
    console.warn('Failed to fetch topics from Firebase:', error.message);
    throw error;
  }
}

/**
 * Load hardcoded fallback topics
 */
function loadFallbackTopics() {
  cachedThemes = FALLBACK_THEMES;
  cachedTopics = FALLBACK_TOPICS;
}

/**
 * Flatten themed topics into a single array
 */
function flattenTopics(themes) {
  const allTopics = [];
  for (const themeKey in themes) {
    const theme = themes[themeKey];
    if (theme.topics && Array.isArray(theme.topics)) {
      allTopics.push(...theme.topics);
    }
  }
  return allTopics;
}

/**
 * Get a random topic (from all themes)
 * Avoids repeating the last topic
 */
export function getRandomTopic() {
  const topics = cachedTopics || FALLBACK_TOPICS;

  let newTopic;
  let attempts = 0;
  do {
    const randomIndex = Math.floor(Math.random() * topics.length);
    newTopic = topics[randomIndex];
    attempts++;
  } while (newTopic === lastUsedTopic && topics.length > 1 && attempts < 10);

  lastUsedTopic = newTopic;
  return newTopic;
}

/**
 * Get a random topic from a specific theme
 */
export function getRandomTopicFromTheme(themeKey) {
  const themes = cachedThemes || FALLBACK_THEMES;
  const theme = themes[themeKey];

  if (!theme || !theme.topics || theme.topics.length === 0) {
    return getRandomTopic(); // Fallback to any topic
  }

  let newTopic;
  let attempts = 0;
  do {
    const randomIndex = Math.floor(Math.random() * theme.topics.length);
    newTopic = theme.topics[randomIndex];
    attempts++;
  } while (newTopic === lastUsedTopic && theme.topics.length > 1 && attempts < 10);

  lastUsedTopic = newTopic;
  return newTopic;
}

/**
 * Get multiple unique random topics
 */
export function getRandomTopics(count = 3, themeKey = null) {
  let topics;

  if (themeKey) {
    const themes = cachedThemes || FALLBACK_THEMES;
    topics = themes[themeKey]?.topics || [];
  } else {
    topics = cachedTopics || FALLBACK_TOPICS;
  }

  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, topics.length));
}

/**
 * Get all available themes
 */
export function getThemes() {
  const themes = cachedThemes || FALLBACK_THEMES;

  return Object.entries(themes).map(([key, theme]) => ({
    key,
    name: theme.name,
    emoji: theme.emoji,
    topicCount: theme.topics?.length || 0,
  }));
}

/**
 * Get a specific theme by key
 */
export function getTheme(themeKey) {
  const themes = cachedThemes || FALLBACK_THEMES;
  return themes[themeKey] || null;
}

/**
 * Force refresh topics from Firebase
 */
export async function refreshTopics() {
  try {
    await fetchFromFirebase();
    return true;
  } catch (error) {
    console.error('Failed to refresh topics:', error);
    return false;
  }
}

/**
 * Get topic count
 */
export function getTopicCount() {
  const topics = cachedTopics || FALLBACK_TOPICS;
  return topics.length;
}

/**
 * Clear topic cache (for debugging/testing)
 */
export async function clearTopicCache() {
  cachedTopics = null;
  cachedThemes = null;
  await AsyncStorage.multiRemove([CACHE_KEY, CACHE_VERSION_KEY]);
}
