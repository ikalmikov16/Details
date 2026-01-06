/**
 * Room code generation utilities
 */

// Character set for room codes
// Excludes O and 0 to avoid confusion
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const ROOM_CODE_LENGTH = 6;

/**
 * Generate a random room code
 * @returns {string} A 6-character uppercase room code
 */
export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
  }
  return code;
}

/**
 * Validate a room code format
 * @param {string} code - The code to validate
 * @returns {boolean} True if valid format
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== ROOM_CODE_LENGTH) return false;

  // Check each character is in allowed set
  for (const char of code) {
    if (!ROOM_CODE_CHARS.includes(char)) return false;
  }
  return true;
}

/**
 * Normalize a room code (uppercase, trim)
 * @param {string} code - The code to normalize
 * @returns {string} Normalized code
 */
export function normalizeRoomCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

// Export constants for testing
export const CHARS = ROOM_CODE_CHARS;
export const LENGTH = ROOM_CODE_LENGTH;
