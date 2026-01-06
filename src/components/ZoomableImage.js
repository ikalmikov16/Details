import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * ZoomableImage - Pinch to zoom image that springs back when released
 * Only uses pinch gesture (2 fingers) so single-finger swipes pass through to parent
 */
export default function ZoomableImage({ source, style, resizeMode = 'contain' }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      // Clamp scale between 1 and 4
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, 1), 4);
    })
    .onEnd(() => {
      // Spring back to original size when released
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pinchGesture}>
      <Animated.Image
        source={source}
        style={[styles.image, style, animatedStyle]}
        resizeMode={resizeMode}
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
