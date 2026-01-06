# Firebase Setup Guide

This guide walks you through setting up Firebase for SketchOff.

## 📋 Prerequisites

- A Google account
- Access to the [Firebase Console](https://console.firebase.google.com/)

## 🔥 Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter a project name (e.g., "SketchOff")
4. Enable or disable Google Analytics (optional)
5. Click **Create project**

## 🔐 Step 2: Enable Authentication

1. In the Firebase Console, go to **Build > Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Anonymous** sign-in
5. Click **Save**

Anonymous auth allows players to use the app without creating accounts while still having secure access to their game data.

## 💾 Step 3: Set Up Realtime Database

1. Go to **Build > Realtime Database**
2. Click **Create Database**
3. Choose a location closest to your users
4. Start in **locked mode** (we'll add rules next)
5. Click **Enable**

### Configure Database Rules

1. Go to the **Rules** tab
2. Replace the default rules with the contents of `src/config/firebase.rules.json`:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || data.child('players').child(auth.uid).exists())",
        
        "players": {
          "$playerId": {
            ".write": "auth != null && (auth.uid === $playerId || data.parent().parent().child('hostId').val() === auth.uid)"
          }
        },
        
        "drawings": {
          "$round": {
            "$playerId": {
              ".write": "auth != null && auth.uid === $playerId"
            }
          }
        },
        
        "ratings": {
          "$round": {
            "$raterId": {
              ".write": "auth != null && auth.uid === $raterId"
            }
          }
        }
      }
    }
  }
}
```

3. Click **Publish**

## 📁 Step 4: Set Up Cloud Storage

1. Go to **Build > Storage**
2. Click **Get started**
3. Start in **production mode**
4. Choose the same location as your database
5. Click **Done**

### Configure Storage Rules

1. Go to the **Rules** tab
2. Replace with the contents of `src/config/storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /drawings/{roomCode}/{fileName} {
      // Allow read if user is authenticated
      allow read: if request.auth != null;
      
      // Allow write if user is authenticated and file is reasonable size
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. Click **Publish**

## 🔑 Step 5: Get Configuration Keys

1. Go to **Project settings** (gear icon)
2. Scroll down to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "SketchOff Web")
5. Copy the configuration object

You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## ⚙️ Step 6: Configure the App

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> ⚠️ **Important:** Never commit your `.env` file to version control!

## ✅ Step 7: Verify Setup

1. Start the app: `npm start`
2. Try creating a multiplayer room
3. Check Firebase Console:
   - **Realtime Database** should show data under `rooms/`
   - **Authentication** should show an anonymous user
   - **Storage** should show drawings after a game

## 🔧 Troubleshooting

### "Permission denied" errors

- Verify your security rules are published
- Check that anonymous auth is enabled
- Ensure the user is authenticated before database operations

### "Database URL not found"

- Make sure `EXPO_PUBLIC_FIREBASE_DATABASE_URL` is set correctly
- The URL should include `https://` prefix

### Storage upload fails

- Check storage rules allow the file size and type
- Verify the storage bucket URL is correct
- Ensure the user is authenticated

### App not connecting

- Restart the Expo development server
- Clear the app cache: `npx expo start --clear`
- Verify all environment variables are set

## 📊 Monitoring

### Database Usage

Go to **Realtime Database > Usage** to monitor:
- Connections
- Data transferred
- Storage used

### Authentication

Go to **Authentication > Users** to see:
- Active users
- Sign-in providers
- User creation dates

### Storage

Go to **Storage > Files** to see:
- Uploaded drawings
- Storage usage
- File metadata

## 🧹 Cleanup

The app includes automatic cleanup of stale rooms (older than 24 hours). This runs on app startup for authenticated users.

To manually clean up:

1. Go to **Realtime Database > Data**
2. Navigate to `rooms/`
3. Delete old or test rooms

For storage:
1. Go to **Storage > Files**
2. Navigate to `drawings/`
3. Delete old room folders

---

Need help? Check the [Firebase Documentation](https://firebase.google.com/docs) or open an issue.

