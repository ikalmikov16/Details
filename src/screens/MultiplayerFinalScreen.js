import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ref, onValue, remove, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';

export default function MultiplayerFinalScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { roomCode, playerId, playerName } = route.params;
  const [players, setPlayers] = useState([]);
  const [numRounds, setNumRounds] = useState(0);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }

      const roomData = snapshot.val();
      setNumRounds(roomData.settings.numRounds);

      if (roomData.players) {
        setPlayers(Object.values(roomData.players));
      }
    });

    return () => {
      off(roomRef);
    };
  }, [roomCode]);

  const handleBackToHome = async () => {
    // Optionally clean up the room
    try {
      await remove(ref(database, `rooms/${roomCode}`));
    } catch (error) {
      console.error('Error removing room:', error);
    }
    navigation.navigate('Welcome');
  };

  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>🏆 Final Results</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>After {numRounds} rounds</Text>

        {winner && (
          <View style={[styles.winnerContainer, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}>
            <Text style={styles.winnerEmoji}>👑</Text>
            <Text style={[styles.winnerLabel, { color: theme.textSecondary }]}>Champion</Text>
            <Text style={[styles.winnerName, { color: theme.text }]}>{winner.name}</Text>
            <Text style={[styles.winnerScore, { color: theme.accent }]}>{winner.totalScore} points</Text>
          </View>
        )}

        <View style={[styles.leaderboardContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.leaderboardTitle, { color: theme.text }]}>📊 Final Standings</Text>
          
          {sortedPlayers.map((player, position) => (
            <View 
              key={player.id} 
              style={[
                styles.leaderboardRow,
                { borderBottomColor: theme.border },
                position === 0 && [styles.leaderboardRowFirst, { backgroundColor: theme.background }],
              ]}
            >
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>
                  {position === 0 ? '🥇' : position === 1 ? '🥈' : position === 2 ? '🥉' : `${position + 1}`}
                </Text>
              </View>
              
              <View style={styles.playerInfoContainer}>
                <Text style={[styles.leaderboardName, { color: theme.text }]}>
                  {player.name} {player.id === playerId && '(You)'}
                </Text>
                <Text style={[styles.averageScore, { color: theme.textSecondary }]}>
                  Avg: {(player.totalScore / numRounds).toFixed(1)} per round
                </Text>
              </View>
              
              <Text style={[styles.leaderboardScore, { color: theme.primary }]}>{player.totalScore}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.homeButton, { backgroundColor: theme.primary }]}
          onPress={handleBackToHome}
        >
          <Text style={styles.homeButtonText}>🏠 Back to Home</Text>
        </TouchableOpacity>
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
    fontSize: 36,
    fontWeight: 'bold',
    
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    
    textAlign: 'center',
    marginBottom: 30,
  },
  winnerContainer: {
    
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  winnerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  winnerLabel: {
    fontSize: 18,
    
    fontWeight: '600',
    marginBottom: 5,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 'bold',
    
    marginBottom: 10,
  },
  winnerScore: {
    fontSize: 24,
    
    fontWeight: 'bold',
  },
  leaderboardContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    
    marginBottom: 20,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leaderboardRowFirst: {
    
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderBottomWidth: 0,
  },
  positionContainer: {
    width: 50,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 24,
  },
  playerInfoContainer: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 18,
    fontWeight: 'bold',
    
    marginBottom: 3,
  },
  averageScore: {
    fontSize: 14,
    
  },
  leaderboardScore: {
    fontSize: 24,
    fontWeight: 'bold',
    
  },
  homeButton: {
    
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
