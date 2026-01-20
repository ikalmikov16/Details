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
  documentDirectory: 'file://documents/',
  downloadAsync: jest.fn(() => Promise.resolve({ uri: 'file://documents/test.png' })),
  deleteAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
}));

// Mock expo-media-library
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  saveToLibraryAsync: jest.fn(() => Promise.resolve()),
  createAssetAsync: jest.fn(() => Promise.resolve({ id: 'asset-1', uri: 'file://asset.png' })),
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

// Mock react-native-signature-canvas
jest.mock('react-native-signature-canvas', () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      clearSignature: jest.fn(),
      readSignature: jest.fn(),
      undo: jest.fn(),
      changePenColor: jest.fn(),
      changePenSize: jest.fn(),
    }));
    return React.createElement(View, { testID: 'signature-canvas', ...props });
  });
});
