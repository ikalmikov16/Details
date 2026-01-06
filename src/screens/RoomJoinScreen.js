import { get, ref, set } from 'firebase/database';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LoadingOverlay, OfflineBanner } from '../components/NetworkStatus';
import { auth, database } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { error as hapticError, success, tapMedium } from '../utils/haptics';
import { useNetworkStatus } from '../utils/network';

export default function RoomJoinScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { isConnected } = useNetworkStatus();
  const [playerName, setPlayerName] = useState('');
  // Pre-fill room code from deep link if provided
  const [roomCode, setRoomCode] = useState(route.params?.roomCode || '');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async () => {
    if (isJoining) return;

    if (!isConnected) {
      Alert.alert('Offline', 'Please check your internet connection and try again.');
      return;
    }

    if (playerName.trim() === '') {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (roomCode.trim() === '') {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    // Ensure user is authenticated
    if (!auth.currentUser) {
      Alert.alert('Error', 'Not authenticated. Please restart the app.');
      return;
    }

    const code = roomCode.trim().toUpperCase();

    setIsJoining(true);

    try {
      const roomRef = ref(database, `rooms/${code}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        Alert.alert('Room Not Found', 'Please check the code and try again.');
        setIsJoining(false);
        return;
      }

      const roomData = snapshot.val();

      if (roomData.status !== 'lobby') {
        Alert.alert(
          'Game Started',
          'This game has already started. Ask the host to create a new room.'
        );
        setIsJoining(false);
        return;
      }

      // Use the authenticated user's UID as the player ID
      // This is required for Firebase security rules to work properly
      const playerId = auth.currentUser.uid;

      // Check if this user is already in the room
      if (roomData.players && roomData.players[playerId]) {
        Alert.alert('Already Joined', 'You are already in this room.');
        setIsJoining(false);
        navigation.replace('Lobby', {
          roomCode: code,
          playerId,
          playerName: roomData.players[playerId].name,
        });
        return;
      }

      // Write player info directly to their player path
      // (can't update room root because user isn't a player yet - security rules)
      await set(ref(database, `rooms/${code}/players/${playerId}`), {
        id: playerId,
        name: playerName.trim(),
        totalScore: 0,
        roundScore: 0,
      });

      success(); // Haptic feedback on successful join
      navigation.replace('Lobby', {
        roomCode: code,
        playerId,
        playerName: playerName.trim(),
      });
    } catch (error) {
      console.error('Error joining room:', error);
      hapticError(); // Haptic feedback on error
      Alert.alert('Error', 'Failed to join room. Please check your connection and try again.');
      setIsJoining(false);
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <OfflineBanner visible={!isConnected} />
      <LoadingOverlay visible={isJoining} message="Joining room..." />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.text }]}>🚪 Join Game Room</Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.textSecondary }]}>Your Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={theme.textSecondary}
            value={playerName}
            onChangeText={setPlayerName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Room Code</Text>
          <TextInput
            style={[
              styles.codeInput,
              { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="XXXXXX"
            placeholderTextColor={theme.textSecondary}
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            { backgroundColor: theme.primary },
            (!isConnected || isJoining) && styles.buttonDisabled,
          ]}
          onPress={() => {
            tapMedium();
            handleJoinRoom();
          }}
          disabled={!isConnected || isJoining}
        >
          <Text style={styles.joinButtonText}>
            {!isConnected ? 'Offline' : isJoining ? 'Joining...' : 'Join Room'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 30,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    fontWeight: '500',
  },
  codeInput: {
    borderRadius: 12,
    padding: 18,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
  },
  joinButton: {
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
