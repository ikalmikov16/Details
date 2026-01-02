import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { ref, onValue, update, off } from 'firebase/database';
import { database } from '../config/firebase';
import { getRandomTopic } from '../data/topics';
import { useTheme } from '../context/ThemeContext';

export default function MultiplayerResultsScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { roomCode, playerId, playerName } = route.params;
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [numRounds, setNumRounds] = useState(3);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        Alert.alert('Error', 'Room not found');
        navigation.replace('Welcome');
        return;
      }

      const roomData = snapshot.val();
      setCurrentRound(roomData.currentRound || 1);
      setNumRounds(roomData.settings.numRounds);

      if (roomData.players) {
        const playersList = Object.values(roomData.players);
        setPlayers(playersList);
        
        const currentPlayer = playersList.find(p => p.id === playerId);
        if (currentPlayer) {
          setIsHost(currentPlayer.isHost);
        }
      }

      // Check if moved to next round
      if (roomData.status === 'drawing' && roomData.currentRound > currentRound) {
        navigation.replace('MultiplayerDrawing', {
          roomCode,
          playerId,
          playerName,
        });
      }

      // Check if game finished
      if (roomData.status === 'finished') {
        navigation.replace('MultiplayerFinal', {
          roomCode,
          playerId,
          playerName,
        });
      }
    });

    return () => {
      off(roomRef);
    };
  }, [roomCode, playerId]);

  const handleNextRound = async () => {
    if (currentRound < numRounds) {
      try {
        const nextRound = currentRound + 1;
        const topic = getRandomTopic();
        
        await update(ref(database, `rooms/${roomCode}`), {
          status: 'drawing',
          currentRound: nextRound,
          currentTopic: topic,
          drawingStartTime: Date.now(),
          drawings: {}, // Clear previous round drawings
          ratings: {}, // Clear previous round ratings
        });
      } catch (error) {
        console.error('Error starting next round:', error);
        Alert.alert('Error', 'Failed to start next round.');
      }
    } else {
      // Game finished
      try {
        await update(ref(database, `rooms/${roomCode}`), {
          status: 'finished',
        });
      } catch (error) {
        console.error('Error finishing game:', error);
      }
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aRoundScore = a.roundScore || 0;
    const bRoundScore = b.roundScore || 0;
    return bRoundScore - aRoundScore;
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>🎉 Round {currentRound} Results</Text>

        <View style={styles.podiumContainer}>
          {sortedPlayers.map((player, position) => (
            <View 
              key={player.id} 
              style={[
                styles.playerCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                position === 0 && [styles.firstPlace, { borderColor: theme.accent }],
              ]}
            >
              <View style={[styles.positionBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.positionText}>
                  {position === 0 ? '🥇' : position === 1 ? '🥈' : position === 2 ? '🥉' : `#${position + 1}`}
                </Text>
              </View>
              
              <View style={styles.playerInfo}>
                <Text style={[styles.playerNameText, { color: theme.text }]}>
                  {player.name} {player.id === playerId && '(You)'}
                </Text>
                <Text style={[styles.roundScoreText, { color: theme.success }]}>
                  {player.roundScore || 0} points this round
                </Text>
                <Text style={[styles.totalScoreText, { color: theme.textSecondary }]}>
                  Total: {player.totalScore || 0} points
                </Text>
              </View>
            </View>
          ))}
        </View>

        {isHost && (
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: theme.primary }]}
            onPress={handleNextRound}
          >
            <Text style={styles.continueButtonText}>
              {currentRound < numRounds 
                ? `Continue to Round ${currentRound + 1} →` 
                : 'View Final Results 🏆'
              }
            </Text>
          </TouchableOpacity>
        )}

        {!isHost && (
          <View style={[styles.waitingCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
              Waiting for host to continue...
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    
    textAlign: 'center',
    marginBottom: 30,
  },
  podiumContainer: {
    gap: 15,
    marginBottom: 30,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  firstPlace: {
    
    borderWidth: 3,
    
  },
  positionBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  positionText: {
    fontSize: 28,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    
    marginBottom: 5,
  },
  roundScoreText: {
    fontSize: 16,
    
    fontWeight: '600',
    marginBottom: 3,
  },
  totalScoreText: {
    fontSize: 14,
    
  },
  continueButton: {
    
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    
    fontStyle: 'italic',
  },
});
