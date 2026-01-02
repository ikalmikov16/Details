import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ref, get, update, push } from 'firebase/database';
import { database } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';

export default function RoomJoinScreen({ navigation }) {
  const { theme } = useTheme();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async () => {
    if (isJoining) return; // Prevent double submission

    if (playerName.trim() === '') {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (roomCode.trim() === '') {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    const code = roomCode.trim().toUpperCase();

    setIsJoining(true);

    try {
      const roomRef = ref(database, `rooms/${code}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        Alert.alert('Error', 'Room not found. Please check the code.');
        setIsJoining(false);
        return;
      }

      const roomData = snapshot.val();

      if (roomData.status !== 'lobby') {
        Alert.alert('Error', 'This game has already started.');
        setIsJoining(false);
        return;
      }

      const playerId = push(ref(database, 'temp')).key;

      await update(ref(database, `rooms/${code}/players/${playerId}`), {
        id: playerId,
        name: playerName.trim(),
        isHost: false,
        totalScore: 0,
        joined: Date.now(),
      });

      navigation.replace('Lobby', {
        roomCode: code,
        playerId,
        playerName: playerName.trim(),
      });
      // Don't reset isJoining here as we're navigating away
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>🎨 Join Game Room</Text>

      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Your Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          placeholder="Enter your name"
          placeholderTextColor={theme.textSecondary}
          value={playerName}
          onChangeText={setPlayerName}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Room Code</Text>
        <TextInput
          style={[styles.codeInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
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
          isJoining && [styles.joinButtonDisabled, { opacity: 0.6 }]
        ]}
        onPress={handleJoinRoom}
        disabled={isJoining}
        activeOpacity={isJoining ? 1 : 0.7}
      >
        <Text style={styles.joinButtonText}>
          {isJoining ? 'Joining...' : 'Join Room'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 30,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  codeInput: {
    borderRadius: 10,
    padding: 15,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 6,
    borderWidth: 2,
    fontFamily: 'Courier',
    fontVariant: ['tabular-nums'],
  },
  joinButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
