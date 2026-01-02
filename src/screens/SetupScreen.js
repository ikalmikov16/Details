import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';

export default function SetupScreen({ navigation }) {
  const { players, addPlayer, removePlayer, numRounds, setNumRounds, timeLimit, setTimeLimit } = useGame();
  const { theme } = useTheme();
  const [playerName, setPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim() === '') {
      Alert.alert('Error', 'Please enter a player name');
      return;
    }
    addPlayer(playerName.trim());
    setPlayerName('');
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      Alert.alert('Need More Players', 'You need at least 2 players to start the game');
      return;
    }
    navigation.navigate('Topic');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Setup Your Game</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>Configure players and rules</Text>
        </View>

        {/* Game Settings */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚙️</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Game Settings</Text>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Number of Rounds:</Text>
            <View style={styles.counterContainer}>
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
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Time Limit (seconds):</Text>
            <View style={styles.counterContainer}>
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
        </View>

        {/* Add Players */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👥</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Players</Text>
          </View>
          
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Enter player name"
              placeholderTextColor={theme.textSecondary}
              value={playerName}
              onChangeText={setPlayerName}
              onSubmitEditing={handleAddPlayer}
            />
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: theme.success }]}
              onPress={handleAddPlayer}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.playersContainer}>
            {players.length === 0 ? (
              <Text style={[styles.noPlayersText, { color: theme.textSecondary }]}>No players added yet</Text>
            ) : (
              players.map((player, index) => (
                <View key={index} style={[styles.playerCard, { backgroundColor: theme.background }]}>
                  <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
                  <TouchableOpacity 
                    style={[styles.removeButton, { backgroundColor: '#ef4444' }]}
                    onPress={() => removePlayer(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity 
          style={[
            styles.startButton,
            { backgroundColor: theme.primary },
            players.length < 2 && [styles.startButtonDisabled, { backgroundColor: theme.textSecondary }]
          ]}
          onPress={handleStartGame}
        >
          <Text style={styles.startButtonText}>
            Start Game ({players.length} {players.length === 1 ? 'Player' : 'Players'})
          </Text>
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
  },
  pageHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: -2,
  },
  counterValue: {
    fontSize: 24,
    fontWeight: '900',
    minWidth: 50,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    fontWeight: '600',
    borderWidth: 1.5,
  },
  addButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playersContainer: {
    gap: 12,
  },
  noPlayersText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    padding: 24,
    fontWeight: '600',
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  startButton: {
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

