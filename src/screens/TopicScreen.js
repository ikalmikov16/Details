import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { getRandomTopic } from '../data/topics';

export default function TopicScreen({ navigation }) {
  const { currentRound, numRounds, timeLimit, setCurrentTopic, currentTopic } = useGame();
  const { theme } = useTheme();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  useEffect(() => {
    // Generate topic when screen loads if not already set
    if (!currentTopic) {
      const topic = getRandomTopic();
      setCurrentTopic(topic);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleTimerEnd();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  const handleTimerEnd = () => {
    setIsTimerRunning(false);

    Alert.alert(
      '⏰ Time\'s Up!',
      'Drawing time is over! Now it\'s time to rate the drawings.',
      [
        {
          text: 'Start Rating',
          onPress: () => navigation.navigate('Rating'),
        },
      ]
    );
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handleNewTopic = () => {
    const topic = getRandomTopic();
    setCurrentTopic(topic);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Round Info */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.roundBadge, { color: theme.primary }]}>
          ROUND {currentRound}/{numRounds}
        </Text>
      </View>

      {/* Topic Card */}
      <View style={[styles.topicContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={[styles.topicIconCircle, { backgroundColor: theme.primary + '20' }]}>
          <Text style={styles.topicIcon}>🎨</Text>
        </View>
        <Text style={[styles.topicLabel, { color: theme.textSecondary }]}>Your Drawing Topic</Text>
        <Text style={[styles.topicText, { color: theme.text }]}>{currentTopic}</Text>
        
        {!isTimerRunning && (
          <TouchableOpacity 
            style={[styles.newTopicButton, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={handleNewTopic}
          >
            <Text style={[styles.newTopicButtonText, { color: theme.primary }]}>🔄 New Topic</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timer Display */}
      <View style={[styles.timerContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[
          styles.timerText,
          { color: theme.primary },
          timeRemaining <= 10 && styles.timerTextWarning
        ]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={[styles.timerLabel, { color: theme.textSecondary }]}>
          {isTimerRunning ? '⏱️ Time Remaining' : '⏸️ Ready to Start'}
        </Text>
      </View>

      {!isTimerRunning ? (
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: theme.success }]}
          onPress={handleStartTimer}
        >
          <Text style={styles.startButtonText}>▶️ Start Timer</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.drawingInfo, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.drawingInfoText, { color: theme.text }]}>✏️ Everyone is drawing now!</Text>
          <Text style={[styles.drawingInfoSubtext, { color: theme.textSecondary }]}>
            Draw on paper and wait for the timer to end
          </Text>
        </View>
      )}

      {isTimerRunning && (
        <TouchableOpacity 
          style={[styles.skipButton, { backgroundColor: theme.warning }]}
          onPress={() => {
            Alert.alert(
              'Skip Timer',
              'Are you sure everyone is done drawing?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Skip', 
                  onPress: () => {
                    setIsTimerRunning(false);
                    navigation.navigate('Rating');
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.skipButtonText}>⏭️ Skip to Rating</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  roundBadge: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  topicContainer: {
    borderRadius: 24,
    padding: 36,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  topicIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicIcon: {
    fontSize: 36,
  },
  topicLabel: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  topicText: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  newTopicButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
  },
  newTopicButtonText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1.5,
  },
  timerText: {
    fontSize: 80,
    fontWeight: '900',
    letterSpacing: 2,
  },
  timerTextWarning: {
    color: '#ef4444',
  },
  timerLabel: {
    fontSize: 18,
    marginTop: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startButton: {
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  drawingInfo: {
    marginHorizontal: 20,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
  },
  drawingInfoText: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  drawingInfoSubtext: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  skipButton: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

