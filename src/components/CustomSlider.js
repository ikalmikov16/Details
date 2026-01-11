import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View, PanResponder } from 'react-native';

/**
 * CustomSlider - A slider with a larger thumb that's easier to grab on Android
 */
export default function CustomSlider({
  value = 0,
  minimumValue = 0,
  maximumValue = 10,
  step = 1,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#E0E0E0',
  thumbTintColor = '#007AFF',
  disabled = false,
  style,
}) {
  const thumbSize = Platform.OS === 'android' ? 32 : 28;
  const trackHeight = 4;

  const thumbScale = useRef(new Animated.Value(1)).current;
  const currentValueRef = useRef(value);
  const containerRef = useRef(null);
  const layoutRef = useRef({ x: 0, width: 0 });

  const [position, setPosition] = useState(0);

  // Calculate position from value
  const valueToPosition = useCallback(
    (val, width) => {
      const w = width || layoutRef.current.width;
      if (w === 0) return 0;
      const range = maximumValue - minimumValue;
      const percentage = (val - minimumValue) / range;
      return percentage * w;
    },
    [maximumValue, minimumValue]
  );

  // Calculate value from x position relative to container
  const xToValue = useCallback(
    (x) => {
      const width = layoutRef.current.width;
      if (width === 0) return minimumValue;
      const percentage = Math.max(0, Math.min(1, x / width));
      const range = maximumValue - minimumValue;
      let newValue = minimumValue + percentage * range;

      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      return Math.max(minimumValue, Math.min(maximumValue, newValue));
    },
    [minimumValue, maximumValue, step]
  );

  // Update position when value prop changes
  React.useEffect(() => {
    if (layoutRef.current.width > 0) {
      const newPos = valueToPosition(value);
      setPosition(newPos);
      currentValueRef.current = value;
    }
  }, [value, valueToPosition]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        Animated.spring(thumbScale, {
          toValue: 1.2,
          useNativeDriver: true,
          friction: 7,
          tension: 100,
        }).start();

        if (onSlidingStart) {
          onSlidingStart();
        }

        // Get touch position relative to container
        const touchX = evt.nativeEvent.locationX;
        updateFromX(touchX);
      },

      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        updateFromX(touchX);
      },

      onPanResponderRelease: (evt) => {
        Animated.spring(thumbScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 100,
        }).start();

        if (onSlidingComplete) {
          onSlidingComplete(currentValueRef.current);
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(thumbScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 100,
        }).start();

        if (onSlidingComplete) {
          onSlidingComplete(currentValueRef.current);
        }
      },
    })
  ).current;

  const updateFromX = (x) => {
    const width = layoutRef.current.width;
    if (width === 0) return;

    // Clamp x to valid range
    const clampedX = Math.max(0, Math.min(width, x));
    setPosition(clampedX);

    const newValue = xToValue(clampedX);
    if (newValue !== currentValueRef.current) {
      currentValueRef.current = newValue;
      if (onValueChange) {
        onValueChange(newValue);
      }
    }
  };

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    layoutRef.current.width = width;
    // Update position based on current value
    setPosition(valueToPosition(value, width));
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Track */}
      <View
        style={[
          styles.track,
          {
            height: trackHeight,
            backgroundColor: maximumTrackTintColor,
            borderRadius: trackHeight / 2,
          },
        ]}
      >
        {/* Filled track */}
        <View
          style={[
            styles.filledTrack,
            {
              width: Math.max(0, position),
              height: trackHeight,
              backgroundColor: minimumTrackTintColor,
              borderRadius: trackHeight / 2,
            },
          ]}
        />
      </View>

      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            left: position - thumbSize / 2,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: thumbTintColor,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: thumbScale }],
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    width: '100%',
    position: 'relative',
  },
  filledTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
