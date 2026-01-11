# Changelog

All notable changes to SketchOff will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-11

### 🎮 Multiplayer Mode

- Create and join game rooms with 6-character room codes
- QR code generation for easy room sharing
- Real-time player synchronization via Firebase
- Host controls: kick players, adjust settings, start game
- Configurable rounds (1-10) and time limits (30s - 5min)
- Edit your display name while in lobby
- "Play Again" feature to quickly start a new game with same players

### 📱 Single Device Mode

- Pass-the-phone style gameplay for local play
- Works completely offline
- Paper drawing with digital scoring
- Same rating and results system as multiplayer

### 🎨 Drawing Features

- Full-featured drawing canvas powered by Skia
- 12 color palette with pen/eraser toggle
- Adjustable stroke width
- Undo functionality
- Clear canvas option
- Auto-capture backup to preserve drawings

### 🎯 Topics System

- 100 curated drawing prompts across 10 categories
- Topics fetched from Firebase with local fallback
- Version-based topic updates without app updates
- Categories: Everyday Objects, Animals, Food, Things With Faces, People Doing Things, Broken Things, Tiny vs Giant, Silly Combinations, One Weird Rule, Dream scenarios

### ⭐ Rating System

- Swipe-based card interface for rating drawings
- 0-10 slider rating scale
- View your own drawing before rating others
- Save drawings to device photo library
- Share drawings via system share sheet

### 🏆 Results & Scoring

- Round-by-round results with score breakdown
- Expandable rating details (who gave what score)
- Final standings with winner celebration
- Tie detection and handling
- Drawing gallery to view all submissions

### ✨ Game Experience

- Animated "Get Ready" intro with countdown
- Real-time timer with urgency colors
- Clock tick sounds for final 10 seconds
- Haptic feedback throughout the app
- Sound effects for success, completion, and celebration
- Auto-submit drawings when time expires
- Player submission status tracking

### 🖥 User Interface

- Dark mode design
- iOS-style wheel pickers for time selection
- Pinch-to-zoom image viewer
- Offline status banner
- Loading overlays for async operations
- Safe area support for notched devices
- Error boundary for crash recovery

### 🔒 Privacy & Security

- Privacy consent screen on first launch
- Anonymous Firebase authentication
- No personal data collection required
- Game data auto-deleted within 24 hours
- Local-only statistics storage
- Comprehensive Firebase security rules

### 🔗 Sharing & Deep Links

- Share room codes via system share sheet
- Share game results as formatted text
- Deep linking support (`sketchoff://join/CODE`)
- QR code scanning to join games

### 📊 Player Statistics

- Games played tracking
- Win count and win rate
- Total score and average per round
- Best single-round score
- Recent game history (last 10 games)

### 📱 Platform Support

- iOS (full features)
- Android (full features)
- Web (limited - viewing and rating only, no drawing)

### 🔧 Technical Stack

- React Native 0.81 with Expo SDK 54
- Firebase Realtime Database for game state
- Firebase Storage for drawing images
- Firebase Anonymous Authentication
- React Navigation 7 with native stack
- @shopify/react-native-skia for drawing
- react-native-free-canvas for touch handling
- Automatic stale room cleanup (24h)
- Archive system for completed games

---

## Future Ideas

- [ ] Custom drawing prompts from host
- [ ] More topic categories via Firebase
- [ ] Player avatars/profile pictures
- [ ] In-game reactions/emojis
- [ ] Spectator mode
- [ ] Light theme option
- [ ] Achievement system
- [ ] Friend lists and invites
