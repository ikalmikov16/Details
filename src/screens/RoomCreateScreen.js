import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ref, set, push } from 'firebase/database';
import { database } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';

export default function RoomCreateScreen({ navigation }) {
  const { theme } = useTheme();
  const [playerName, setPlayerName] = useState('');
  const [numRounds, setNumRounds] = useState(3);
  const [timeLimit, setTimeLimit] = useState(60);
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async () => {
    if (isCreating) return; // Prevent double submission

    if (playerName.trim() === '') {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsCreating(true);

    try {
      const roomCode = generateRoomCode();
      const roomRef = ref(database, `rooms/${roomCode}`);
      
      const playerId = push(ref(database, 'temp')).key;
      
      await set(roomRef, {
        code: roomCode,
        hostId: playerId,
        settings: {
          numRounds,
          timeLimit,
        },
        status: 'lobby', // lobby, drawing, rating, results, finished
        currentRound: 1,
        currentTopic: '',
        players: {
          [playerId]: {
            id: playerId,
            name: playerName.trim(),
            isHost: true,
            totalScore: 0,
            joined: Date.now(),
          },
        },
        drawings: {},
        ratings: {},
        createdAt: Date.now(),
      });

      navigation.replace('Lobby', {
        roomCode,
        playerId,
        playerName: playerName.trim(),
      });
      // Don't reset isCreating here as we're navigating away
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>🎨 Create Game Room</Text>

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

        <Text style={[styles.label, { color: theme.textSecondary }]}>Number of Rounds</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterButton, { backgroundColor: theme.primary }]}
            onPress={() => setNumRounds(Math.max(1, numRounds - 1))}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.counterValue, { color: theme.text }]}>{numRounds}</Text>
          <TouchableOpacity
            style={[styles.counterButton, { backgroundColor: theme.primary }]}
            onPress={() => setNumRounds(numRounds + 1)}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Time Limit (seconds)</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterButton, { backgroundColor: theme.primary }]}
            onPress={() => setTimeLimit(Math.max(30, timeLimit - 30))}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.counterValue, { color: theme.text }]}>{timeLimit}</Text>
          <TouchableOpacity
            style={[styles.counterButton, { backgroundColor: theme.primary }]}
            onPress={() => setTimeLimit(timeLimit + 30)}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.createButton,
          { backgroundColor: theme.success },
          isCreating && [styles.createButtonDisabled, { opacity: 0.6 }]
        ]}
        onPress={handleCreateRoom}
        disabled={isCreating}
        activeOpacity={isCreating ? 1 : 0.7}
      >
        <Text style={styles.createButtonText}>
          {isCreating ? 'Creating...' : 'Create Room'}
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
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 30,
    minWidth: 60,
    textAlign: 'center',
  },
  createButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
