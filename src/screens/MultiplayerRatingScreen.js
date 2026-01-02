import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { ref, onValue, update, get, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';

export default function MultiplayerRatingScreen({ route, navigation }) {
  const { roomCode, playerId, playerName } = route.params;
  const { theme } = useTheme();
  const [players, setPlayers] = useState([]);
  const [drawings, setDrawings] = useState({});
  const [ratings, setRatings] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        Alert.alert('Error', 'Room not found');
        navigation.replace('Welcome');
        return;
      }

      const roomData = snapshot.val();
      
      if (roomData.players) {
        setPlayers(Object.values(roomData.players));
      }

      if (roomData.drawings) {
        setDrawings(roomData.drawings);
      }

      // Check if moved to results
      if (roomData.status === 'results') {
        navigation.replace('MultiplayerResults', {
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

  const handleRating = (targetPlayerId, score) => {
    if (targetPlayerId === playerId) return; // Can't rate yourself

    setRatings({
      ...ratings,
      [targetPlayerId]: score,
    });
  };

  const handleSubmitRatings = async () => {
    // Check if all players (except self) have been rated
    const otherPlayers = players.filter(p => p.id !== playerId);
    const ratedPlayers = Object.keys(ratings);

    if (ratedPlayers.length < otherPlayers.length) {
      Alert.alert(
        'Incomplete Ratings',
        'Please rate all drawings before submitting.'
      );
      return;
    }

    try {
      // Submit ratings to Firebase
      await update(
        ref(database, `rooms/${roomCode}/ratings/${playerId}`),
        ratings
      );

      setHasSubmitted(true);
      Alert.alert('Success!', 'Your ratings have been submitted!');

      // Check if all players have submitted ratings
      await checkAllRatingsSubmitted();
    } catch (error) {
      console.error('Error submitting ratings:', error);
      Alert.alert('Error', 'Failed to submit ratings. Please try again.');
    }
  };

  const checkAllRatingsSubmitted = async () => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const playersCount = Object.keys(roomData.players || {}).length;
      const ratingsCount = Object.keys(roomData.ratings || {}).length;

      if (playersCount === ratingsCount) {
        // All players submitted ratings, calculate scores
        await calculateScores(roomData);
      }
    }
  };

  const calculateScores = async (roomData) => {
    const scores = {};
    const allRatings = roomData.ratings || {};

    // Calculate total score for each player
    Object.keys(roomData.players).forEach(pId => {
      scores[pId] = 0;
      
      // Sum up all ratings this player received
      Object.keys(allRatings).forEach(raterId => {
        if (allRatings[raterId][pId]) {
          scores[pId] += allRatings[raterId][pId];
        }
      });
    });

    // Update player scores
    const updates = {};
    Object.keys(scores).forEach(pId => {
      updates[`players/${pId}/roundScore`] = scores[pId];
      updates[`players/${pId}/totalScore`] = 
        (roomData.players[pId].totalScore || 0) + scores[pId];
    });
    updates.status = 'results';

    await update(ref(database, `rooms/${roomCode}`), updates);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>⭐ Rate the Drawings</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Rate each drawing from 1-10</Text>

        {players
          .filter(p => p.id !== playerId)
          .map((player) => (
            <View key={player.id} style={[styles.drawingCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.playerName, { color: theme.text }]}>{player.name}'s Drawing</Text>
              
              {drawings[player.id]?.url ? (
                <View style={styles.drawingCanvas}>
                  <Image
                    source={{ uri: drawings[player.id].url }}
                    style={styles.drawingImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={[styles.noDrawing, { backgroundColor: theme.background }]}>
                  <Text style={[styles.noDrawingText, { color: theme.textSecondary }]}>
                    No drawing submitted
                  </Text>
                </View>
              )}

              <View style={styles.ratingContainer}>
                <View style={styles.ratingHeader}>
                  <Text style={[styles.ratingLabel, { color: theme.textSecondary }]}>Your Rating:</Text>
                  <View style={[styles.ratingBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.ratingValue}>{ratings[player.id] || 0}</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={ratings[player.id] || 0}
                  onValueChange={(value) => handleRating(player.id, value)}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>0 - Poor</Text>
                  <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>10 - Excellent</Text>
                </View>
              </View>
            </View>
          ))}

        {!hasSubmitted ? (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmitRatings}
          >
            <Text style={styles.submitButtonText}>Submit Ratings →</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.waitingCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.waitingText, { color: theme.success }]}>
              ✓ Submitted! Waiting for other players...
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
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,

    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  drawingCard: {
    
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '700',

    marginBottom: 18,
    letterSpacing: 0.3,
  },
  drawingCanvas: {
    width: '100%',
    height: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  drawingImage: {
    width: '100%',
    height: 300,
  },
  noDrawing: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 18,
    
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  noDrawingText: {
    fontSize: 16,

    fontStyle: 'italic',
    fontWeight: '500',
  },
  ratingContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  ratingBadge: {
    minWidth: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  ratingValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  slider: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  waitingCard: {
    
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  waitingText: {
    fontSize: 18,

    fontWeight: '700',
  },
});
