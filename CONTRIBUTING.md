# Contributing to SketchOff

Thank you for your interest in contributing to SketchOff! This document provides guidelines and information for contributors.

## 🛠 Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (`npx expo`)
- iOS Simulator (Mac only) or Android Emulator
- Firebase project for backend services

### Getting Started

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Firebase credentials
4. Start the dev server: `npm start`

## 📝 Code Style

### Formatting

We use **Prettier** for code formatting and **ESLint** for linting.

```bash
# Format all files
npm run format

# Check formatting without modifying
npm run format:check

# Run linter
npm run lint
```

### Conventions

- **Components**: PascalCase (`DrawingCanvas.js`)
- **Utilities**: camelCase (`sounds.js`)
- **Screens**: PascalCase with `Screen` suffix (`WelcomeScreen.js`)
- **Styles**: Define at bottom of component files using `StyleSheet.create()`

### File Organization

```
src/
├── components/    # Reusable UI components
├── screens/       # Full-screen views (navigation targets)
├── context/       # React Context providers
├── config/        # Configuration files
├── data/          # Static data (topics, etc.)
└── utils/         # Helper functions and utilities
```

## 🎨 Component Guidelines

### Creating New Components

1. Create the file in `src/components/`
2. Use functional components with hooks
3. Access theme via `useTheme()` hook
4. Export as default

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function MyComponent({ prop1, prop2 }) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Component content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Screen Components

- Always handle safe areas using `SafeAreaView` from `react-native-safe-area-context`
- Show `OfflineBanner` when network connectivity is important
- Use `LoadingOverlay` for async operations

## 🔊 Sound & Haptics

### Adding Sounds

1. Add the sound file to `assets/sounds/`
2. Register it in `src/utils/sounds.js`:

```js
const SOUND_FILES = {
  mySound: require('../../assets/sounds/my-sound.mp3'),
};
```

3. Create an export function:

```js
export function playMySound() {
  playSound('mySound', 0.7); // 0.7 = 70% volume
}
```

### Haptic Feedback

Use the functions from `src/utils/haptics.js`:

```js
import { tapLight, tapMedium, tapHeavy, success, warning, error } from '../utils/haptics';

// Light tap for buttons
tapLight();

// Success feedback
success();
```

## 🌐 Platform Considerations

### Web Compatibility

Some features don't work on web:
- Drawing canvas (uses react-native-skia)
- Haptic feedback
- QR code scanning
- `Alert.alert()` with button callbacks

For alerts on web, use this pattern:

```js
if (Platform.OS === 'web') {
  const confirmed = window.confirm('Are you sure?');
  if (confirmed) { /* action */ }
} else {
  Alert.alert('Title', 'Message', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: () => { /* action */ } },
  ]);
}
```

### Safe Areas

Always use `SafeAreaView` for screens without navigation headers:

```jsx
import { SafeAreaView } from 'react-native-safe-area-context';

// For top safe area only (e.g., custom header screens)
<SafeAreaView edges={['top']} style={styles.container}>

// For all edges
<SafeAreaView style={styles.container}>
```

## 🔥 Firebase

### Database Structure

```
rooms/
  {roomCode}/
    code: string
    hostId: string
    status: 'lobby' | 'drawing' | 'rating' | 'results' | 'complete'
    settings: { numRounds, timeLimit }
    players: { [playerId]: { name, isHost, totalScore } }
    drawings: { round1: { [playerId]: { url, submittedAt } } }
    ratings: { round1: { [raterId]: { [drawingPlayerId]: score } } }
```

### Security Rules

When modifying database operations, ensure the corresponding security rules in `src/config/firebase.rules.json` allow the operation.

## 🧪 Testing

### Manual Testing Checklist

Before submitting changes, test:

- [ ] App loads without errors
- [ ] Both game modes work (single device & multiplayer)
- [ ] Drawing canvas functions properly
- [ ] Rating system calculates scores correctly
- [ ] Network offline scenarios are handled
- [ ] Sound and haptics work (on physical device)
- [ ] Dark mode displays correctly

### Testing Multiplayer

1. Open the app on two devices (or use simulator + Expo Go)
2. Create a room on one device
3. Join with the room code on the other
4. Play through a complete game

## 📦 Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS Build
npx eas build --platform all
```

## 🐛 Reporting Issues

When reporting bugs, please include:

1. Device/platform information
2. Steps to reproduce
3. Expected vs actual behavior
4. Console logs if available
5. Screenshots if applicable

## 💡 Feature Requests

Feature requests are welcome! Please describe:

1. The problem you're trying to solve
2. Your proposed solution
3. Any alternatives you've considered

---

Happy coding! 🎨

