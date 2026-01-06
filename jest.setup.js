// Note: @testing-library/react-native v12.4+ has built-in Jest matchers
// No need for @testing-library/jest-native anymore

// Silence console warnings during tests (optional - remove if you want to see them)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock React Native's Platform - must be done before any imports
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform = {
    ...RN.Platform,
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  };
  return RN;
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    volume: 1,
  })),
  setAudioModeAsync: jest.fn(),
}));

// Mock Firebase - more detailed mock in __mocks__ folder
jest.mock('./src/config/firebase', () => require('./__tests__/__mocks__/firebase'));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  PanGestureHandler: 'PanGestureHandler',
  State: {},
  Directions: {},
}));

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file://cache/',
  downloadAsync: jest.fn(() => Promise.resolve({ uri: 'file://cache/test.png' })),
}));

// Mock expo-media-library
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  saveToLibraryAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-view-shot
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file://captured.png')),
}));
