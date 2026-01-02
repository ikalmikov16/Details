import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { ref, onValue, update, off } from 'firebase/database';
import { database } from '../config/firebase';
import { getRandomTopic } from '../data/topics';
import { useTheme } from '../context/ThemeContext';

export default function LobbyScreen({ route, navigation }) {
  const { roomCode, playerId, playerName } = route.params;
  const { theme } = useTheme();
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [roomSettings, setRoomSettings] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        Alert.alert('Room Closed', 'The host has closed the room.');
        navigation.replace('Welcome');
        return;
      }

      const roomData = snapshot.val();
      
      // Check if game has started
      if (roomData.status === 'drawing') {
        navigation.replace('MultiplayerDrawing', {
          roomCode,
          playerId,
          playerName,
        });
        return;
      }

      // Update players list
      if (roomData.players) {
        const playersList = Object.values(roomData.players);
        setPlayers(playersList);
        
        // Check if current user is host
        const currentPlayer = playersList.find(p => p.id === playerId);
        if (currentPlayer) {
          setIsHost(currentPlayer.isHost);
        }
      }

      setRoomSettings(roomData.settings);
    });

    return () => {
      off(roomRef);
    };
  }, [roomCode, playerId]);

  const handleStartGame = async () => {
    if (isStarting) return; // Prevent double submission

    if (players.length < 2) {
      Alert.alert('Need More Players', 'You need at least 2 players to start the game.');
      return;
    }

    setIsStarting(true);

    try {
      const topic = getRandomTopic();
      await update(ref(database, `rooms/${roomCode}`), {
        status: 'drawing',
        currentTopic: topic,
        drawingStartTime: Date.now(),
      });
      // Navigation will happen automatically via the onValue listener
      // Don't reset isStarting - we're navigating away
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
      setIsStarting(false);
    }
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my drawing game! Room code: ${roomCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Game Lobby</Text>

        <View style={[styles.codeCard, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
          <Text style={[styles.codeLabel, { color: '#78350f' }]}>Room Code</Text>
          <View style={styles.codeDisplay}>
            {roomCode.split('').map((char, index) => (
              <View key={index} style={styles.codeCharBox}>
                <Text style={[styles.codeChar, { color: '#78350f' }]}>{char}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#f59e0b' }]} onPress={handleShareCode}>
            <Text style={styles.shareButtonText}>📤 Share Code</Text>
          </TouchableOpacity>
        </View>

        {roomSettings && (
          <View style={[styles.settingsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>Game Settings</Text>
            <Text style={[styles.settingText, { color: theme.textSecondary }]}>
              Rounds: {roomSettings.numRounds}
            </Text>
            <Text style={[styles.settingText, { color: theme.textSecondary }]}>
              Time Limit: {roomSettings.timeLimit}s
            </Text>
          </View>
        )}

        <View style={[styles.playersCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.playersTitle, { color: theme.text }]}>
            👥 Players ({players.length})
          </Text>
          {players.map((player, index) => (
            <View key={player.id} style={styles.playerRow}>
              <Text style={[styles.playerName, { color: theme.text }]}>
                {player.name} {player.isHost && '👑'}
              </Text>
              {player.id === playerId && (
                <View style={[styles.youBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
          ))}
          {players.length < 2 && (
            <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
              Waiting for more players to join...
            </Text>
          )}
        </View>

        {isHost && (
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: theme.success },
              (players.length < 2 || isStarting) && [styles.startButtonDisabled, { backgroundColor: theme.textSecondary, opacity: 0.6 }],
            ]}
            onPress={handleStartGame}
            disabled={players.length < 2 || isStarting}
            activeOpacity={isStarting ? 1 : 0.7}
          >
            <Text style={styles.startButtonText}>
              {isStarting ? 'Starting...' : players.length < 2 ? 'Need 2+ Players' : 'Start Game! 🎨'}
            </Text>
          </TouchableOpacity>
        )}

        {!isHost && (
          <View style={[styles.waitingCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={styles.waitingText}>
              Waiting for host to start the game...
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 30,
    letterSpacing: 0.5,
  },
  codeCard: {
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  codeLabel: {
    fontSize: 18,

    marginBottom: 8,
    fontWeight: '600',
  },
  codeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
    flexWrap: 'wrap',
    width: '100%',
  },
  codeCharBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 10,
    width: 42,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(120, 53, 15, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  codeChar: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Courier',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
  shareButton: {
    
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsCard: {
    
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',

    marginBottom: 14,
  },
  settingText: {
    fontSize: 17,

    marginBottom: 8,
    fontWeight: '500',
  },
  playersCard: {
    
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    
  },
  playersTitle: {
    fontSize: 22,
    fontWeight: '700',

    marginBottom: 18,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  playerName: {
    fontSize: 18,

    fontWeight: '500',
  },
  youBadge: {
    
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  waitingText: {
    fontSize: 16,

    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  startButton: {
    
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonDisabled: {
    
    shadowOpacity: 0.2,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  waitingCard: {
    
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    
  },
});
