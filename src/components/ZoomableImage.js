import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * ZoomableImage - Pinch to zoom image that springs back when released
 * Only uses pinch gesture (2 fingers) so single-finger swipes pass through to parent
 * Includes smooth fade-in loading animation
 */
export default function ZoomableImage({ source, style, resizeMode = 'contain' }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const [isLoading, setIsLoading] = useState(true);

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
    opacity: opacity.value,
  }));

  const handleLoadEnd = () => {
    setIsLoading(false);
    opacity.value = withTiming(1, { duration: 200 });
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      <GestureDetector gesture={pinchGesture}>
        <Animated.Image
          source={source}
          style={[styles.image, style, animatedStyle]}
          resizeMode={resizeMode}
          onLoadEnd={handleLoadEnd}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
