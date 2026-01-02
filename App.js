import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from './src/context/GameContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { signInAnonymouslyIfNeeded } from './src/config/firebase';

// Single Phone Mode Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import TopicScreen from './src/screens/TopicScreen';
import RatingScreen from './src/screens/RatingScreen';
import RoundResultsScreen from './src/screens/RoundResultsScreen';
import FinalResultsScreen from './src/screens/FinalResultsScreen';

// Multiplayer Mode Screens
import RoomCreateScreen from './src/screens/RoomCreateScreen';
import RoomJoinScreen from './src/screens/RoomJoinScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import MultiplayerDrawingScreen from './src/screens/MultiplayerDrawingScreen';
import MultiplayerRatingScreen from './src/screens/MultiplayerRatingScreen';
import MultiplayerResultsScreen from './src/screens/MultiplayerResultsScreen';
import MultiplayerFinalScreen from './src/screens/MultiplayerFinalScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Initialize anonymous authentication on app start
    signInAnonymouslyIfNeeded()
      .then(() => {
        setIsAuthReady(true);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <GameProvider>
        <NavigationContainer>
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

          {/* Single Phone Mode */}
          <Stack.Screen 
            name="Setup" 
            component={SetupScreen}
            options={{ title: 'Game Setup' }}
          />
          <Stack.Screen 
            name="Topic" 
            component={TopicScreen}
            options={{ title: 'Draw!' }}
          />
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
              title: 'Game Lobby',
              headerBackVisible: false,
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="MultiplayerDrawing" 
            component={MultiplayerDrawingScreen}
            options={{ 
              title: 'Draw!',
              headerBackVisible: false,
              headerLeft: () => null,
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
