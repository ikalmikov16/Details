import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utilities
 * Only works on iOS and Android (not web)
 */

const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light tap feedback - for button presses
 */
export const tapLight = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Medium tap feedback - for important actions
 */
export const tapMedium = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Heavy tap feedback - for significant events
 */
export const tapHeavy = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Success feedback - for completed actions
 */
export const success = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Warning feedback - for alerts/warnings
 */
export const warning = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Error feedback - for errors
 */
export const error = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

/**
 * Selection feedback - for selection changes
 */
export const selection = () => {
  if (isHapticsSupported) {
    Haptics.selectionAsync();
  }
};

export default {
  tapLight,
  tapMedium,
  tapHeavy,
  success,
  warning,
  error,
  selection,
};
