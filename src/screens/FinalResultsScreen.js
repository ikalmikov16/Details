import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';

export default function FinalResultsScreen({ navigation }) {
  const { players, numRounds, resetGame } = useGame();
  const { theme } = useTheme();

  const handlePlayAgain = () => {
    // Navigate first, then reset to avoid rendering errors
    navigation.replace('Welcome');
    // Reset after a small delay to ensure navigation completes
    setTimeout(() => {
      resetGame();
    }, 100);
  };

  // Guard against empty players array
  if (!players || players.length === 0) {
    return null;
  }

  // Sort players by total score
  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>🏆 Final Results</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>After {numRounds} rounds</Text>

        {/* Winner Section */}
        {winner && (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerEmoji}>👑</Text>
            <Text style={styles.winnerLabel}>Champion</Text>
            <Text style={styles.winnerName}>{winner.name}</Text>
            <Text style={styles.winnerScore}>{winner.totalScore} points</Text>
          </View>
        )}

        {/* All Players Leaderboard */}
        <View style={[styles.leaderboardContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.leaderboardTitle, { color: theme.text }]}>📊 Final Standings</Text>
          
          {sortedPlayers.map((player, position) => (
            <View 
              key={player.name || position} 
              style={[
                styles.leaderboardRow,
                { borderBottomColor: theme.border },
                position === 0 && styles.leaderboardRowFirst,
              ]}
            >
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>
                  {position === 0 ? '🥇' : position === 1 ? '🥈' : position === 2 ? '🥉' : `${position + 1}`}
                </Text>
              </View>
              
              <View style={styles.playerInfoContainer}>
                <Text style={[styles.leaderboardName, { color: theme.text }]}>{player.name}</Text>
                <Text style={[styles.averageScore, { color: theme.textSecondary }]}>
                  Avg: {(player.totalScore / numRounds).toFixed(1)} per round
                </Text>
              </View>
              
              <Text style={[styles.leaderboardScore, { color: theme.primary }]}>{player.totalScore}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.playAgainButton}
          onPress={handlePlayAgain}
        >
          <Text style={styles.playAgainButtonText}>🎨 Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.homeButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={[styles.homeButtonText, { color: theme.textSecondary }]}>Back to Home</Text>
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
    backgroundColor: '#fef3c7',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  winnerEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  winnerLabel: {
    fontSize: 16,
    color: '#92400e',
    fontWeight: '900',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  winnerName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#78350f',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  winnerScore: {
    fontSize: 32,
    color: '#92400e',
    fontWeight: '900',
    letterSpacing: 1,
  },
  leaderboardContainer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1.5,
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
  },
  leaderboardRowFirst: {
    backgroundColor: '#fef9e7',
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
  playAgainButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

