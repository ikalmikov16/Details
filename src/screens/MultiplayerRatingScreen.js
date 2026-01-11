import { get, onValue, ref, update } from 'firebase/database';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RatingCard from '../components/RatingCard';
import { LoadingOverlay, OfflineBanner } from '../components/NetworkStatus';
import { database } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { error as hapticError, success, tapMedium } from '../utils/haptics';
import { useNetworkStatus } from '../utils/network';

export default function MultiplayerRatingScreen({ route, navigation }) {
  const { roomCode, playerId, playerName } = route.params;
  const { theme } = useTheme();
  const { isConnected } = useNetworkStatus();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [players, setPlayers] = useState([]);
  const [drawings, setDrawings] = useState({});
  const [ratings, setRatings] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef(null);
  const [isSliderActive, setIsSliderActive] = useState(false);

  // Hide the navigation header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Get current player (self)
  const currentPlayer = players.find((p) => p.id === playerId);

  // Get players to rate (exclude self)
  const playersToRate = players.filter((p) => p.id !== playerId);

  // All drawings to show: own drawing first, then others to rate
  const allDrawings = currentPlayer
    ? [{ ...currentPlayer, isOwnDrawing: true }, ...playersToRate]
    : playersToRate;

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert('Room Closed', 'The room has been closed.');
          navigation.replace('Welcome');
          return;
        }

        const roomData = snapshot.val();

        if (roomData.players) {
          const playersList = Object.values(roomData.players);
          setPlayers(playersList);
          setTotalPlayers(playersList.length);
        }

        // Get current round
        const round = roomData.currentRound || 1;

        // Get drawings for current round
        if (roomData.drawings?.[`round${round}`]) {
          const roundDrawings = roomData.drawings[`round${round}`];
          setDrawings(roundDrawings);
        }

        // Track who has submitted ratings
        const submittedIds = Object.keys(roomData.ratings || {});
        setSubmittedPlayerIds(submittedIds);
        setSubmittedCount(submittedIds.length);

        // Check if moved to results
        if (roomData.status === 'results') {
          navigation.replace('MultiplayerResults', {
            roomCode,
            playerId,
            playerName,
          });
        }
      },
      (error) => {
        console.error('Firebase error:', error);
        Alert.alert('Connection Error', 'Lost connection to the game.');
      }
    );

    return () => unsubscribe();
  }, [roomCode, playerId, navigation, playerName]);

  const handleRating = (targetPlayerId, score) => {
    if (targetPlayerId === playerId) return;
    setRatings((prev) => ({
      ...prev,
      [targetPlayerId]: score,
    }));
  };

  const handleSubmitRatings = async () => {
    if (isSubmitting || hasSubmitted) return;

    if (!isConnected) {
      Alert.alert('Offline', 'Please check your internet connection and try again.');
      return;
    }

    // Check if all players have been rated
    const ratedPlayers = Object.keys(ratings);
    if (ratedPlayers.length < playersToRate.length) {
      // Find unrated players
      const unratedPlayers = playersToRate.filter((p) => ratings[p.id] === undefined);
      const unratedNames = unratedPlayers.map((p) => p.name).join(', ');
      Alert.alert(
        'Incomplete Ratings',
        `Please rate all drawings before submitting.\n\nMissing: ${unratedNames}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await update(ref(database, `rooms/${roomCode}/ratings/${playerId}`), ratings);
      setHasSubmitted(true);
      setIsSubmitting(false);
      success();
      await checkAllRatingsSubmitted();
    } catch (error) {
      console.error('Error submitting ratings:', error);
      setIsSubmitting(false);
      hapticError();
      Alert.alert('Error', 'Failed to submit ratings. Please check your connection and try again.');
    }
  };

  const checkAllRatingsSubmitted = async () => {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);

      if (snapshot.exists()) {
        const roomData = snapshot.val();
        const playersCount = Object.keys(roomData.players || {}).length;
        const ratingsCount = Object.keys(roomData.ratings || {}).length;

        if (playersCount === ratingsCount) {
          await calculateScores(roomData);
        }
      }
    } catch (error) {
      console.error('Error checking ratings:', error);
    }
  };

  const calculateScores = async (roomData) => {
    const scores = {};
    const allRatings = roomData.ratings || {};

    Object.keys(roomData.players).forEach((pId) => {
      scores[pId] = 0;
      Object.keys(allRatings).forEach((raterId) => {
        if (allRatings[raterId][pId]) {
          scores[pId] += allRatings[raterId][pId];
        }
      });
    });

    const updates = {};
    Object.keys(scores).forEach((pId) => {
      updates[`players/${pId}/roundScore`] = scores[pId];
      updates[`players/${pId}/totalScore`] = (roomData.players[pId].totalScore || 0) + scores[pId];
    });
    updates.status = 'results';
    updates.lastActivity = Date.now();

    await update(ref(database, `rooms/${roomCode}`), updates);
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderRatingCard = ({ item: player }) => {
    const drawingUrl = drawings[player.id]?.url;

    return (
      <RatingCard
        player={player}
        drawingUrl={drawingUrl}
        currentRating={ratings[player.id]}
        onRatingChange={(score) => handleRating(player.id, score)}
        disabled={hasSubmitted}
        isOwnDrawing={player.isOwnDrawing || false}
        onSliderActiveChange={setIsSliderActive}
      />
    );
  };

  const allRated = Object.keys(ratings).length === playersToRate.length;

  // Waiting screen after submission
  if (hasSubmitted) {
    return (
      <View style={[styles.wrapper, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <OfflineBanner visible={!isConnected} />

        <View style={styles.waitingContainer}>
          <View style={[styles.waitingCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.waitingEmoji}>✅</Text>
            <Text style={[styles.waitingTitle, { color: theme.success }]}>Ratings Submitted!</Text>
            <Text style={[styles.waitingSubtext, { color: theme.textSecondary }]}>
              Waiting for others... ({submittedCount}/{totalPlayers})
            </Text>

            <View style={styles.playerStatusContainer}>
              {players.map((player) => {
                const hasPlayerSubmitted = submittedPlayerIds.includes(player.id);
                return (
                  <View
                    key={player.id}
                    style={[
                      styles.playerStatusItem,
                      {
                        backgroundColor: hasPlayerSubmitted
                          ? theme.success + '20'
                          : theme.border + '40',
                      },
                    ]}
                  >
                    <Text style={styles.playerStatusIcon}>{hasPlayerSubmitted ? '✅' : '⏳'}</Text>
                    <Text
                      style={[
                        styles.playerStatusName,
                        { color: hasPlayerSubmitted ? theme.success : theme.textSecondary },
                      ]}
                    >
                      {player.name}
                      {player.id === playerId && ' (you)'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={[styles.wrapper, { backgroundColor: theme.background, paddingTop: insets.top }]}
    >
      <OfflineBanner visible={!isConnected} />
      <LoadingOverlay visible={isSubmitting} message="Submitting ratings..." />

      {/* Progress dots */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {allDrawings.map((drawing, index) => {
            const isOwn = drawing.isOwnDrawing;
            const isRated = !isOwn && ratings[drawing.id] !== undefined;
            const isCurrent = index === currentIndex;

            return (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isOwn ? theme.accent : isRated ? theme.success : theme.border,
                    borderWidth: isCurrent ? 3 : 0,
                    borderColor: theme.primary,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Horizontal swipe list */}
      <FlatList
        ref={flatListRef}
        data={allDrawings}
        renderItem={renderRatingCard}
        keyExtractor={(item) => `${item.id}-${item.isOwnDrawing ? 'own' : 'rate'}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        style={styles.flatList}
        scrollEnabled={!isSliderActive}
      />

      {/* Submit button - only show when all rated */}
      {allRated && (
        <View style={[styles.submitContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.success },
              (!isConnected || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={() => {
              tapMedium();
              handleSubmitRatings();
            }}
            disabled={!isConnected || isSubmitting}
          >
            <Text style={styles.submitButtonText}>Submit All Ratings ✓</Text>
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  flatList: {
    flex: 1,
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Waiting screen
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  waitingCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  waitingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  playerStatusContainer: {
    width: '100%',
  },
  playerStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  playerStatusIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  playerStatusName: {
    fontSize: 15,
    fontWeight: '600',
  },
});
