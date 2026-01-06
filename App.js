import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, LogBox, Text, View } from 'react-native';

// Suppress Expo Go media library warning (only affects Expo Go, not production builds)
LogBox.ignoreLogs(['Due to changes in Androids permission requirements']);
import { signInAnonymouslyIfNeeded } from './src/config/firebase';
import { GameProvider } from './src/context/GameContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { runCleanupTasks } from './src/utils/roomCleanup';
import { initSounds } from './src/utils/sounds';

// Single Phone Mode Screens
import FinalResultsScreen from './src/screens/FinalResultsScreen';
import RatingScreen from './src/screens/RatingScreen';
import RoundResultsScreen from './src/screens/RoundResultsScreen';
import SetupScreen from './src/screens/SetupScreen';
import StatsScreen from './src/screens/StatsScreen';
import TopicScreen from './src/screens/TopicScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// Multiplayer Mode Screens
import LobbyScreen from './src/screens/LobbyScreen';
import MultiplayerDrawingScreen from './src/screens/MultiplayerDrawingScreen';
import MultiplayerFinalScreen from './src/screens/MultiplayerFinalScreen';
import MultiplayerRatingScreen from './src/screens/MultiplayerRatingScreen';
import MultiplayerResultsScreen from './src/screens/MultiplayerResultsScreen';
import RoomCreateScreen from './src/screens/RoomCreateScreen';
import RoomJoinScreen from './src/screens/RoomJoinScreen';

const Stack = createNativeStackNavigator();

// Deep linking configuration
const prefix = Linking.createURL('/');

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Deep linking configuration for NavigationContainer
  const linking = useMemo(
    () => ({
      prefixes: [prefix, 'sketchoff://'],
      config: {
        screens: {
          RoomJoin: {
            path: 'join/:roomCode?',
            parse: {
              roomCode: (roomCode) => roomCode?.toUpperCase() || '',
            },
          },
        },
      },
    }),
    []
  );

  useEffect(() => {
    // Initialize sound system
    initSounds();

    // Initialize anonymous authentication on app start
    signInAnonymouslyIfNeeded()
      .then(() => {
        setIsAuthReady(true);

        // Run cleanup tasks in background after auth is ready
        // This cleans up stale rooms and old archives to save database space
        runCleanupTasks().catch((error) => {
          console.warn('Cleanup tasks failed:', error);
        });
      })
      .catch((error) => {
        console.error('Auth initialization failed:', error);
        setAuthError(error.message);
        // Still allow the app to load for single-device mode
        setIsAuthReady(true);
      });
  }, []);

  // Show loading screen while authenticating
  if (!isAuthReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a2e',
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <GameProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6366f1',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerShadowVisible: false, // Removes the border/shadow line
            }}
          >
            {/* Main Welcome */}
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{
                headerShown: false,
              }}
            />

            {/* Stats */}
            <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Your Stats' }} />

            {/* Single Phone Mode */}
            <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Game Setup' }} />
            <Stack.Screen name="Topic" component={TopicScreen} options={{ title: 'Draw!' }} />
            <Stack.Screen
              name="Rating"
              component={RatingScreen}
              options={{ title: 'Rate Drawings' }}
            />
            <Stack.Screen
              name="RoundResults"
              component={RoundResultsScreen}
              options={{ title: 'Round Results' }}
            />
            <Stack.Screen
              name="FinalResults"
              component={FinalResultsScreen}
              options={{ title: 'Final Results' }}
            />

            {/* Multiplayer Mode */}
            <Stack.Screen
              name="RoomCreate"
              component={RoomCreateScreen}
              options={{ title: 'Create Room' }}
            />
            <Stack.Screen
              name="RoomJoin"
              component={RoomJoinScreen}
              options={{ title: 'Join Room' }}
            />
            <Stack.Screen
              name="Lobby"
              component={LobbyScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="MultiplayerDrawing"
              component={MultiplayerDrawingScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="MultiplayerRating"
              component={MultiplayerRatingScreen}
              options={{
                title: 'Rate Drawings',
                headerBackVisible: false,
                headerLeft: () => null,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="MultiplayerResults"
              component={MultiplayerResultsScreen}
              options={{
                title: 'Round Results',
                headerBackVisible: false,
                headerLeft: () => null,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="MultiplayerFinal"
              component={MultiplayerFinalScreen}
              options={{ title: 'Final Results' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </ThemeProvider>
  );
}
