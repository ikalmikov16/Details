import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { error as hapticError, warning } from '../utils/haptics';

/**
 * Visual timer with progress bar
 * @param {number} seconds - Current seconds remaining
 * @param {number} total - Total seconds for the timer
 * @param {boolean} isRunning - Whether the timer is active
 * @param {function} onLowTime - Callback when time is low
 */
export default function TimerProgress({ seconds, total, isRunning = true, onLowTime }) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);
  const hasWarnedRef = useRef(false);
  const hasCriticalRef = useRef(false);

  const progress = total > 0 ? seconds / total : 0;
  const isLowTime = seconds <= 10 && seconds > 3;
  const isCritical = seconds <= 3 && seconds > 0;

  // Pulse animation for low time
  useEffect(() => {
    // Stop any existing animation first
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (isCritical && isRunning) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else if (isLowTime && isRunning) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [isLowTime, isCritical, isRunning, pulseAnim]);

  // Haptic feedback for low time
  useEffect(() => {
    if (seconds === 10 && !hasWarnedRef.current && isRunning) {
      hasWarnedRef.current = true;
      warning();
      if (onLowTime) onLowTime(10);
    }
    if (seconds === 3 && !hasCriticalRef.current && isRunning) {
      hasCriticalRef.current = true;
      hapticError();
      if (onLowTime) onLowTime(3);
    }
    // Reset warnings when timer resets
    if (seconds > 10) {
      hasWarnedRef.current = false;
      hasCriticalRef.current = false;
    }
  }, [seconds, isRunning, onLowTime]);

  const getTimerColor = () => {
    if (isCritical) return '#FF3B30';
    if (isLowTime) return '#FF9500';
    return theme.primary;
  };

  const getProgressColor = () => {
    if (isCritical) return '#FF3B30';
    if (isLowTime) return '#FF9500';
    return theme.primary;
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.timerContainer,
          {
            backgroundColor: theme.cardBackground,
            borderColor: getTimerColor() + '40',
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text
          style={[styles.timerText, { color: getTimerColor() }, isCritical && styles.criticalText]}
        >
          {isCritical && '⚠️ '}
          {formatTime(seconds)}
          {isCritical && ' ⚠️'}
        </Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress * 100}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  timerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  criticalText: {
    fontSize: 26,
    fontWeight: '800',
  },
  progressContainer: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
