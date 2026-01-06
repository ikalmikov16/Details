# Changelog

All notable changes to SketchOff will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-06

### Added

- **Multiplayer Mode**
  - Create and join rooms with 6-character room codes
  - QR code generation for easy room sharing
  - Real-time player synchronization
  - Host controls (kick players, start game)
  - Configurable rounds (1-10) and time limits (10s - 10min)
  - Drawing canvas with color picker, brush sizes, and eraser
  - Star-based rating system (1-5 stars)
  - Round-by-round results with leaderboard
  - Final standings with winner celebration

- **Single Device Mode**
  - Pass-the-phone style gameplay
  - Works offline
  - Paper drawing with digital scoring
  - Same rating and results system as multiplayer

- **Drawing Features**
  - Full-featured canvas with Skia rendering
  - 12 color palette
  - 4 brush sizes
  - Eraser tool
  - Undo/redo support
  - Clear canvas option

- **Game Experience**
  - 100+ creative drawing prompts
  - Animated countdown intro
  - Clock tick sounds for final 10 seconds
  - Haptic feedback throughout
  - Sound effects for actions and celebrations
  - Auto-submit on time expiration

- **UI/UX**
  - Dark mode support (automatic)
  - iOS-style wheel pickers
  - Zoomable image viewer for drawings
  - Drawing gallery with thumbnails
  - Offline status indicators
  - Loading overlays for async operations
  - Safe area support for modern devices

- **Sharing**
  - Share room codes via system share sheet
  - Share game results as text
  - Deep linking support (`sketchoff://join/CODE`)

- **Player Stats**
  - Game history tracking
  - Win/loss statistics
  - Local storage persistence

- **Platform Support**
  - iOS (full features)
  - Android (full features)
  - Web (limited - no drawing, can rate and view)

### Technical

- React Native 0.81 with Expo SDK 54
- Firebase Realtime Database for game state
- Firebase Storage for drawings
- Firebase Anonymous Auth for security
- React Navigation 7 for routing
- Automatic stale room cleanup
- Comprehensive security rules

---

## Future Plans

- [ ] Custom drawing prompts
- [ ] Themed prompt packs
- [ ] Player avatars
- [ ] Chat/reactions during games
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Achievement system
- [ ] Social features (friends, invites)

