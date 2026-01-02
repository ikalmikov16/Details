# Details - Drawing Game

A fun multiplayer drawing game built with React Native and Expo where players draw, rate each other's artwork, and compete for the highest scores!

## Game Modes

### Single Device Mode

Pass-the-phone style gameplay where everyone draws on paper:

1. Add players and configure game settings
2. A drawing topic is displayed and a timer starts
3. Everyone draws on paper while the timer runs
4. When time's up, pass the phone around to rate each drawing
5. See round results and continue to the next round
6. View final standings after all rounds

### Multiplayer Mode

Each player uses their own phone:

1. Host creates a room and shares the room code
2. Other players join using the room code
3. Everyone draws on their own device
4. Drawings are uploaded and everyone rates each other
5. Results are synced in real-time across all devices

## Tech Stack

- **React Native** with **Expo** for cross-platform mobile development
- **Firebase Realtime Database** for multiplayer game state sync
- **Firebase Storage** for storing drawings
- **Firebase Auth** (anonymous) for secure access
- **React Navigation** for screen navigation

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Realtime Database and Storage enabled

### Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on your device:
   - Scan the QR code with Expo Go (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## Project Structure

```
src/
  components/
    DrawingCanvas.js    # Canvas component for drawing
  config/
    firebase.js         # Firebase configuration
  context/
    GameContext.js      # State management for single-device mode
    ThemeContext.js     # Light/dark theme support
  data/
    topics.js           # Drawing prompts/topics
  screens/
    WelcomeScreen.js           # Main menu
    SetupScreen.js             # Single-device game setup
    TopicScreen.js             # Drawing phase (single-device)
    RatingScreen.js            # Rating phase (single-device)
    RoundResultsScreen.js      # Round results (single-device)
    FinalResultsScreen.js      # Final standings (single-device)
    RoomCreateScreen.js        # Create multiplayer room
    RoomJoinScreen.js          # Join multiplayer room
    LobbyScreen.js             # Multiplayer lobby
    MultiplayerDrawingScreen.js # Drawing phase (multiplayer)
    MultiplayerRatingScreen.js  # Rating phase (multiplayer)
    MultiplayerResultsScreen.js # Round results (multiplayer)
    MultiplayerFinalScreen.js   # Final standings (multiplayer)
```

## License

This project is private.
