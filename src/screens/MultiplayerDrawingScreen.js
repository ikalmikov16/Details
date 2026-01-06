import { get, onValue, ref, update } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DrawingToolbar, { ERASER_COLOR } from '../components/DrawingToolbar';
import EnhancedDrawingCanvas from '../components/EnhancedDrawingCanvas';
import { LoadingOverlay, OfflineBanner } from '../components/NetworkStatus';
import { database, storage } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import {
  BLANK_WHITE_PNG_BASE64,
  CANVAS_CAPTURE,
  DRAWING_CONFIG,
  MIN_VALID_DRAWING_LENGTH,
  TIMER_COLORS,
} from '../utils/constants';
import { error as hapticError, success, tapMedium, warning } from '../utils/haptics';
import { useNetworkStatus } from '../utils/network';
import { playClockTickCountdown, playSuccess, stopClockTick } from '../utils/sounds';

export default function MultiplayerDrawingScreen({ route, navigation }) {
  const { roomCode, playerId, playerName } = route.params;
  const { theme } = useTheme();
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const canvasRef = useRef(null);

  const [topic, setTopic] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPlayers, setSubmittedPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);

  // Drawing toolbar state
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [currentStrokeColor, setCurrentStrokeColor] = useState('#000000');

  // Memoize stroke width to prevent unnecessary canvas re-renders
  const strokeWidth = useMemo(
    () => (isEraser ? DRAWING_CONFIG.ERASER_STROKE_WIDTH : DRAWING_CONFIG.PEN_STROKE_WIDTH),
    [isEraser]
  );

  // Intro animation state
  const [showIntro, setShowIntro] = useState(true);
  const [introAnimationDone, setIntroAnimationDone] = useState(false);
  const [introCountdown, setIntroCountdown] = useState(3);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const introOpacity = useRef(new Animated.Value(1)).current;
  const introPulse = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Timer initialization ref to prevent double-start bug
  const timerInitialized = useRef(false);

  // Store the last captured canvas data so it's available during auto-submit
  const lastCanvasDataRef = useRef(null);

  // Lock to prevent concurrent canvas captures (fixes race condition)
  const captureInProgressRef = useRef(false);

  // Helper function to safely capture canvas with lock
  const captureCanvas = useCallback(async () => {
    // Skip if capture already in progress or canvas not ready
    if (captureInProgressRef.current || !canvasRef.current) {
      return lastCanvasDataRef.current;
    }

    captureInProgressRef.current = true;
    try {
      const base64 = await canvasRef.current.toBase64(
        CANVAS_CAPTURE.FORMAT,
        CANVAS_CAPTURE.QUALITY
      );
      if (base64 && base64.length > MIN_VALID_DRAWING_LENGTH) {
        lastCanvasDataRef.current = base64;
        return base64;
      }
    } catch (_e) {
      // Silent fail - return last known good capture
    } finally {
      captureInProgressRef.current = false;
    }
    return lastCanvasDataRef.current;
  }, []);

  // Periodically capture the canvas while drawing for backup
  useEffect(() => {
    if (Platform.OS === 'web' || showIntro || hasSubmitted) return;

    const captureInterval = setInterval(() => {
      if (!hasSubmitted && !isSubmitting) {
        captureCanvas();
      }
    }, CANVAS_CAPTURE.INTERVAL_MS);

    return () => clearInterval(captureInterval);
  }, [showIntro, hasSubmitted, isSubmitting, captureCanvas]);

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
        setTopic(roomData.currentTopic || '');
        setCurrentRound(roomData.currentRound || 1);
        const roomTimeLimit = roomData.settings.timeLimit;

        const playersList = Object.values(roomData.players || {});
        setTotalPlayers(playersList.length);
        setAllPlayers(playersList);

        // Get drawings for current round
        const round = roomData.currentRound || 1;
        const roundDrawings = roomData.drawings?.[`round${round}`] || {};
        const submittedIds = Object.keys(roundDrawings);
        const submitted = playersList.filter((p) => submittedIds.includes(p.id)).map((p) => p.name);
        setSubmittedPlayers(submitted);

        // Set timeRemaining to full time limit - only once when first loading
        if (roomData.drawingStartTime && !timerInitialized.current) {
          timerInitialized.current = true;
          setTimeRemaining(roomTimeLimit);
        }

        if (roomData.status === 'rating') {
          stopClockTick(); // Stop any playing clock tick sound
          navigation.replace('MultiplayerRating', { roomCode, playerId, playerName });
        }
      },
      (error) => {
        console.error('Firebase error:', error);
        Alert.alert('Connection Error', 'Lost connection to the game.');
      }
    );

    // Use the unsubscribe function returned by onValue instead of off()
    return () => unsubscribe();
  }, [roomCode, playerId, navigation, playerName]);

  // Only start the drawing timer after intro animation is complete
  useEffect(() => {
    if (timeRemaining === 0 || !introAnimationDone) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, introAnimationDone]);

  // Check if all players have submitted their drawings
  const checkAllSubmitted = useCallback(async () => {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);

      if (snapshot.exists()) {
        const roomData = snapshot.val();
        const playersCount = Object.keys(roomData.players || {}).length;
        const round = roomData.currentRound || 1;
        const roundDrawings = roomData.drawings?.[`round${round}`] || {};
        const drawingsCount = Object.keys(roundDrawings).length;

        if (playersCount === drawingsCount) {
          await update(ref(database, `rooms/${roomCode}`), { status: 'rating' });
        }
      }
    } catch (error) {
      console.error('Error checking submissions:', error);
    }
  }, [roomCode]);

  // Handle time up - wrapped in useCallback to avoid stale closures
  const handleTimeUp = useCallback(async () => {
    if (hasSubmitted || isSubmitting) return;
    if (!isConnected) return;

    setIsSubmitting(true);

    try {
      let downloadURL;
      let isPlaceholder = false;

      // On native platforms, try to capture the canvas using our synchronized helper
      if (Platform.OS !== 'web') {
        const base64 = await captureCanvas();

        // Upload if we have valid base64
        if (base64 && base64.length > MIN_VALID_DRAWING_LENGTH) {
          try {
            const dataUrl = `data:image/png;base64,${base64}`;
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            const drawingRef = storageRef(
              storage,
              `drawings/${roomCode}/${playerId}_round${currentRound}.png`
            );
            await uploadBytes(drawingRef, blob, { contentType: 'image/png' });
            downloadURL = await getDownloadURL(drawingRef);
          } catch (uploadError) {
            console.error('Auto-submit upload failed:', uploadError);
          }
        }
      }

      // If no drawing captured (web or empty canvas), submit blank white canvas
      if (!downloadURL) {
        try {
          const response = await fetch(`data:image/png;base64,${BLANK_WHITE_PNG_BASE64}`);
          const blob = await response.blob();

          const drawingRef = storageRef(
            storage,
            `drawings/${roomCode}/${playerId}_round${currentRound}.png`
          );
          await uploadBytes(drawingRef, blob, { contentType: 'image/png' });
          downloadURL = await getDownloadURL(drawingRef);
          isPlaceholder = true;
        } catch (uploadError) {
          console.error('Auto-submit: failed to upload placeholder:', uploadError);
        }
      }

      // Update database with the drawing
      await update(ref(database, `rooms/${roomCode}/drawings/round${currentRound}/${playerId}`), {
        url: downloadURL,
        submittedAt: Date.now(),
        ...(isPlaceholder && { isPlaceholder: true }),
      });

      setHasSubmitted(true);
      setIsSubmitting(false);
      success();
      playSuccess();

      // Check if all players have submitted
      checkAllSubmitted();
    } catch (error) {
      console.error('Error auto-submitting drawing:', error);
      setIsSubmitting(false);
    }
  }, [
    hasSubmitted,
    isSubmitting,
    isConnected,
    roomCode,
    playerId,
    currentRound,
    checkAllSubmitted,
    captureCanvas,
  ]);

  // Handle time up separately
  useEffect(() => {
    if (timeRemaining === 0 && introAnimationDone && !hasSubmitted && !isSubmitting) {
      handleTimeUp();
    }
  }, [timeRemaining, introAnimationDone, hasSubmitted, isSubmitting, handleTimeUp]);

  // Haptic and sound feedback at key timer moments
  useEffect(() => {
    if (!introAnimationDone) return;

    // Feedback at specific time milestones
    if (timeRemaining === 30) {
      warning(); // Light warning at 30 seconds
    } else if (timeRemaining === 10) {
      // Start clock tick countdown at 10 seconds - plays continuously
      tapMedium();
      playClockTickCountdown();
    } else if (timeRemaining === 0) {
      // Stop clock tick when time runs out
      stopClockTick();
    }
  }, [timeRemaining, introAnimationDone]);

  // Intro countdown timer
  useEffect(() => {
    if (topic && showIntro && !introAnimationDone && introCountdown > 0) {
      const countdownTimer = setInterval(() => {
        setIntroCountdown((prev) => prev - 1);
      }, 800);

      return () => clearInterval(countdownTimer);
    }
  }, [topic, showIntro, introAnimationDone, introCountdown]);

  // Intro animation - show prompt then animate to top
  useEffect(() => {
    if (topic && showIntro && !introAnimationDone) {
      // Start a gentle pulse animation on the topic
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(introPulse, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(introPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    }
  }, [topic, showIntro, introAnimationDone, introPulse]);

  // Animate out when countdown reaches 0 - Simple fade transition
  useEffect(() => {
    if (introCountdown === 0 && showIntro && !introAnimationDone) {
      // Simple fade out the intro
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowIntro(false);
        setIntroAnimationDone(true);
        // Fade in header and content from top down
        Animated.stagger(100, [
          Animated.timing(headerOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [introCountdown, showIntro, introAnimationDone, introOpacity, headerOpacity, contentOpacity]);

  // Pulse animation for timer when <= 10 seconds
  useEffect(() => {
    if (timeRemaining <= 10 && timeRemaining > 0 && !showIntro) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [timeRemaining, showIntro, pulseAnim]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setIsEraser(false);
    setCurrentStrokeColor(color);
  };

  const handlePenSelect = () => {
    setIsEraser(false);
    setCurrentStrokeColor(selectedColor);
  };

  const handleEraserToggle = () => {
    setIsEraser(true);
    setCurrentStrokeColor(ERASER_COLOR);
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleClear = () => {
    warning();
    Alert.alert('Clear Drawing', 'Are you sure you want to clear your drawing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => canvasRef.current?.reset(),
      },
    ]);
  };

  const submitPlaceholder = async (isAutoSubmit = false) => {
    if (hasSubmitted || isSubmitting) return;

    if (!isConnected) {
      if (!isAutoSubmit) Alert.alert('Offline', 'Please check your internet connection.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`data:image/png;base64,${BLANK_WHITE_PNG_BASE64}`);
      const blob = await response.blob();

      const drawingRef = storageRef(
        storage,
        `drawings/${roomCode}/${playerId}_round${currentRound}.png`
      );
      await uploadBytes(drawingRef, blob, { contentType: 'image/png' });
      const downloadURL = await getDownloadURL(drawingRef);

      await update(ref(database, `rooms/${roomCode}/drawings/round${currentRound}/${playerId}`), {
        url: downloadURL,
        submittedAt: Date.now(),
        isPlaceholder: true,
      });

      setHasSubmitted(true);
      setIsSubmitting(false);
      checkAllSubmitted();
    } catch (error) {
      console.error('Error submitting placeholder:', error);
      setIsSubmitting(false);
      if (!isAutoSubmit) Alert.alert('Error', 'Failed to submit. Please try again.');
    }
  };

  const handleSubmitDrawing = async (base64Data = null) => {
    if (hasSubmitted || isSubmitting) return;

    if (Platform.OS === 'web') {
      Alert.alert('Drawing Not Available', 'Drawing is not supported on web.');
      return;
    }

    if (!isConnected) {
      Alert.alert('Offline', 'Please check your internet connection.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use provided data or capture from canvas using our synchronized helper
      let base64 = base64Data || (await captureCanvas());

      // If still no drawing, use blank white canvas
      if (!base64 || base64.length < MIN_VALID_DRAWING_LENGTH) {
        try {
          const response = await fetch(`data:image/png;base64,${BLANK_WHITE_PNG_BASE64}`);
          const blob = await response.blob();
          const drawingRef = storageRef(
            storage,
            `drawings/${roomCode}/${playerId}_round${currentRound}.png`
          );
          await uploadBytes(drawingRef, blob, { contentType: 'image/png' });
          const downloadURL = await getDownloadURL(drawingRef);

          await update(
            ref(database, `rooms/${roomCode}/drawings/round${currentRound}/${playerId}`),
            {
              url: downloadURL,
              submittedAt: Date.now(),
              isPlaceholder: true,
            }
          );

          setHasSubmitted(true);
          setIsSubmitting(false);
          success();
          playSuccess();
          checkAllSubmitted();
          return;
        } catch (uploadError) {
          console.error('Manual submit: failed to upload placeholder:', uploadError);
          throw uploadError;
        }
      }

      const dataUrl = `data:image/png;base64,${base64}`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const drawingRef = storageRef(
        storage,
        `drawings/${roomCode}/${playerId}_round${currentRound}.png`
      );
      await uploadBytes(drawingRef, blob, { contentType: 'image/png' });
      const downloadURL = await getDownloadURL(drawingRef);

      await update(ref(database, `rooms/${roomCode}/drawings/round${currentRound}/${playerId}`), {
        url: downloadURL,
        submittedAt: Date.now(),
      });

      setHasSubmitted(true);
      setIsSubmitting(false);
      success();
      playSuccess();
      checkAllSubmitted();
    } catch (error) {
      console.error('Error uploading drawing:', error);
      setIsSubmitting(false);
      hapticError();
      Alert.alert('Error', 'Failed to submit drawing. Please try again.');
    }
  };

  const handleSkipDrawing = async () => {
    await submitPlaceholder(false);
  };

  // Confirm before submitting early
  const confirmSubmitDrawing = () => {
    tapMedium();
    Alert.alert(
      'Submit Drawing?',
      'Are you sure you want to submit your drawing? You still have time remaining.',
      [
        { text: 'Keep Drawing', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => handleSubmitDrawing(),
        },
      ]
    );
  };

  // Submitted waiting view (check this first so it works on all platforms including web)
  if (hasSubmitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.waitingContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.waitingIcon}>✅</Text>
          <Text style={[styles.waitingTitle, { color: theme.success }]}>Drawing Submitted!</Text>
          <Text style={[styles.waitingSubtext, { color: theme.textSecondary }]}>
            Waiting for others... ({submittedPlayers.length}/{totalPlayers})
          </Text>

          <ScrollView style={styles.playerStatusList} showsVerticalScrollIndicator={false}>
            {allPlayers.map((player) => {
              const hasPlayerSubmitted = submittedPlayers.includes(player.name);
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
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Time's up view
  if (timeRemaining === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.timeUpContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.timeUpIcon}>⏰</Text>
          <Text style={[styles.timeUpTitle, { color: theme.warning }]}>Time&apos;s Up!</Text>
          <Text style={[styles.timeUpSubtext, { color: theme.textSecondary }]}>
            Submitting your drawing...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Web not supported view (after hasSubmitted check so waiting view shows after skip)
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <OfflineBanner visible={!isConnected} />
        <View style={styles.webNotSupported}>
          <Text style={styles.webNotSupportedIcon}>🎨</Text>
          <Text style={[styles.webNotSupportedTitle, { color: theme.text }]}>
            Drawing Not Available on Web
          </Text>
          <Text style={[styles.webNotSupportedText, { color: theme.textSecondary }]}>
            Please use the mobile app (iOS/Android) to draw.
          </Text>
          <TouchableOpacity
            style={[styles.webSkipButton, { backgroundColor: theme.primary }]}
            onPress={handleSkipDrawing}
            disabled={!isConnected || isSubmitting}
          >
            <Text style={styles.webSkipButtonText}>
              {isSubmitting ? 'Submitting...' : '⏭️ Skip Round'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Timer color based on urgency
  const getTimerColor = () => {
    if (timeRemaining <= 10) return TIMER_COLORS.CRITICAL;
    if (timeRemaining <= 30) return TIMER_COLORS.WARNING;
    return theme.primary;
  };

  // Main drawing view
  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <OfflineBanner visible={!isConnected} />
      <LoadingOverlay visible={isSubmitting} message="Submitting drawing..." />

      {/* Intro Overlay - shows prompt centered before animating to header */}
      {showIntro && (
        <Animated.View
          style={[
            styles.introOverlay,
            {
              paddingTop: insets.top,
              opacity: introOpacity,
            },
          ]}
        >
          <View style={styles.introContent}>
            <Text style={styles.introLabel}>DRAW</Text>
            <Animated.Text style={[styles.introTopic, { transform: [{ scale: introPulse }] }]}>
              {topic}
            </Animated.Text>
            <View style={styles.introPulseContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>
                  {introCountdown > 0 ? introCountdown : '🎨'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Header: Topic + Timer - with safe area padding */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            paddingTop: insets.top + 10,
            opacity: headerOpacity,
          },
        ]}
      >
        {/* Topic on left, Timer on right */}
        <Text style={[styles.topicText, { color: theme.text }]} numberOfLines={2}>
          {topic}
        </Text>

        <Animated.View
          style={[
            styles.timerContainer,
            { backgroundColor: getTimerColor() },
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </Animated.View>
      </Animated.View>

      {/* Toolbar */}
      <Animated.View style={{ opacity: contentOpacity }}>
        <DrawingToolbar
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          isEraser={isEraser}
          onEraserToggle={handleEraserToggle}
          onPenSelect={handlePenSelect}
          onUndo={handleUndo}
          disabled={isSubmitting || showIntro}
        />
      </Animated.View>

      {/* Canvas with floating buttons - full width, no margins */}
      <Animated.View style={[styles.canvasWrapper, { opacity: contentOpacity }]}>
        <View style={styles.canvasContainer}>
          <EnhancedDrawingCanvas
            ref={canvasRef}
            strokeColor={currentStrokeColor}
            strokeWidth={strokeWidth}
            backgroundColor="#FFFFFF"
            isEraser={isEraser}
          />
        </View>

        {/* Floating Clear Button - Bottom Left */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            styles.floatingButtonLeft,
            styles.clearButton,
            { bottom: Math.max(insets.bottom, 16) + 8 },
          ]}
          onPress={handleClear}
          disabled={isSubmitting || showIntro}
          activeOpacity={0.85}
        >
          <Text style={styles.clearButtonText}>↺</Text>
        </TouchableOpacity>

        {/* Floating Submit Button - Bottom Right */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            styles.floatingButtonRight,
            { backgroundColor: theme.success, bottom: Math.max(insets.bottom, 16) + 8 },
            (!isConnected || isSubmitting || showIntro) && styles.buttonDisabled,
          ]}
          onPress={confirmSubmitDrawing}
          disabled={!isConnected || isSubmitting || showIntro}
          activeOpacity={0.85}
        >
          <Text style={styles.floatingButtonIcon}>✓</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  topicText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 12,
  },
  timerContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    color: '#FFFFFF',
  },
  // Canvas styles
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Floating buttons
  floatingButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingButtonLeft: {
    left: 20,
  },
  floatingButtonRight: {
    right: 20,
  },
  floatingButtonIcon: {
    fontSize: 22,
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  clearButtonText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Web not supported styles
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webNotSupportedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  webNotSupportedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  webNotSupportedText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  webSkipButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  webSkipButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Waiting styles
  waitingContainer: {
    flex: 1,
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingIcon: {
    fontSize: 64,
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
    marginBottom: 20,
  },
  playerStatusList: {
    width: '100%',
    maxHeight: 200,
  },
  playerStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  playerStatusIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  playerStatusName: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Time up styles
  timeUpContainer: {
    flex: 1,
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUpIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  timeUpTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  timeUpSubtext: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Intro overlay styles
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  introContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  introLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: '#8b8b9e',
  },
  introTopic: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 24,
    color: '#FFFFFF',
  },
  introPulseContainer: {
    marginTop: 32,
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
  },
  countdownNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#a29bfe',
  },
});
