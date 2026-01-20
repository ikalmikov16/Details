import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * ZoomableImage - Pinch to zoom with pan support
 * - Pinch anywhere to zoom into that point
 * - Pan to move around when zoomed in
 * - Springs back when released
 *
 * Now auto-detects image dimensions and displays at correct aspect ratio
 */
export default function ZoomableImage({
  source,
  resizeMode = 'cover',
  containerWidth,
  maxHeight,
  onDimensionsLoaded,
  showBorder = false,
  onZoomChange,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const opacity = useSharedValue(1); // Start visible - don't hide image
  const [isLoading, setIsLoading] = useState(true);
  // Default to 1:1 aspect ratio - will be updated when image dimensions are loaded
  const [imageDimensions, setImageDimensions] = useState({
    width: 400,
    height: 400,
    aspectRatio: 1,
  });

  // Get actual image dimensions from the URI
  useEffect(() => {
    if (source?.uri) {
      Image.getSize(
        source.uri,
        (width, height) => {
          setImageDimensions({ width, height, aspectRatio: width / height });
          if (onDimensionsLoaded) {
            onDimensionsLoaded({ width, height, aspectRatio: width / height });
          }
        },
        (error) => {
          console.warn('Failed to get image size:', error);
          // Default to 4:3 aspect ratio if we can't get dimensions
          setImageDimensions({ width: 400, height: 300, aspectRatio: 4 / 3 });
        }
      );
    }
  }, [source?.uri, onDimensionsLoaded]);

  const updateZoomState = (zoomed) => {
    if (onZoomChange) {
      onZoomChange(zoomed);
    }
  };

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      // Calculate new scale
      const newScale = Math.min(Math.max(savedScale.value * event.scale, 1), 5);
      scale.value = newScale;

      if (newScale > 1) {
        runOnJS(updateZoomState)(true);
      }
    })
    .onEnd(() => {
      // Spring back to original size and position when released
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      runOnJS(updateZoomState)(false);
    });

  // Pan gesture for moving around when zoomed
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // Combine gestures - pinch and pan work together
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    // If image fails to load, still hide the loading spinner
    setIsLoading(false);
    console.warn('ZoomableImage: Failed to load image');
  };

  // Frame adds extra size around the image
  // Thicker frame especially on sides for classic gallery look
  const frameSizeHorizontal = showBorder ? 56 : 0; // Left/right
  const frameSizeVertical = showBorder ? 44 : 0; // Top/bottom

  // Calculate display dimensions based on actual image aspect ratio
  // Maintains proper aspect ratio even when maxHeight is applied
  const baseWidth = containerWidth || screenWidth;
  // Available space for the image itself (excluding frame)
  const availableWidth = baseWidth - frameSizeHorizontal;
  const availableMaxHeight = maxHeight ? maxHeight - frameSizeVertical : null;

  let imageDisplayWidth = availableWidth;
  let imageDisplayHeight = availableWidth; // Default to square

  if (imageDimensions) {
    imageDisplayHeight = availableWidth / imageDimensions.aspectRatio;

    // If height exceeds maxHeight, scale down both dimensions to maintain aspect ratio
    if (availableMaxHeight && imageDisplayHeight > availableMaxHeight) {
      const scaleRatio = availableMaxHeight / imageDisplayHeight;
      imageDisplayHeight = availableMaxHeight;
      imageDisplayWidth = availableWidth * scaleRatio;
    }
  }

  // Total display size including frame (different horizontal/vertical)
  const displayWidth = imageDisplayWidth + frameSizeHorizontal;
  const displayHeight = imageDisplayHeight + frameSizeVertical;

  if (!showBorder) {
    // No frame - render simple image
    return (
      <View style={[styles.container, { width: displayWidth, height: displayHeight }]}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        )}
        <GestureDetector gesture={composedGesture}>
          <Animated.Image
            source={source}
            style={[styles.image, { width: displayWidth, height: displayHeight }, animatedStyle]}
            resizeMode={resizeMode}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
        </GestureDetector>
      </View>
    );
  }

  // With elegant picture frame - thicker on sides
  // Calculate frame layer sizes (proportionally thicker on sides)
  const outerH = 8,
    outerV = 6; // Outer edge
  const bodyH = 16,
    bodyV = 12; // Main wood body
  const innerH = 6,
    innerV = 5; // Inner edge
  const goldH = 4,
    goldV = 3; // Gold lip
  const matteH = 6,
    matteV = 4; // Matte border

  return (
    <View style={styles.frameContainer}>
      {/* Outer shadow layer */}
      <View
        style={[
          styles.frameShadow,
          {
            width: displayWidth + 6,
            height: displayHeight + 6,
          },
        ]}
      >
        {/* Main frame - outer edge with highlight */}
        <View
          style={[
            styles.frameOuter,
            {
              width: displayWidth,
              height: displayHeight,
              paddingHorizontal: outerH,
              paddingVertical: outerV,
            },
          ]}
        >
          {/* Frame body with wood grain effect */}
          <View
            style={[
              styles.frameBody,
              {
                width: displayWidth - outerH * 2,
                height: displayHeight - outerV * 2,
                paddingHorizontal: bodyH,
                paddingVertical: bodyV,
              },
            ]}
          >
            {/* Inner frame edge - creates depth */}
            <View
              style={[
                styles.frameInnerEdge,
                {
                  width: displayWidth - outerH * 2 - bodyH * 2,
                  height: displayHeight - outerV * 2 - bodyV * 2,
                  paddingHorizontal: innerH,
                  paddingVertical: innerV,
                },
              ]}
            >
              {/* Gold/brass inner lip */}
              <View
                style={[
                  styles.frameGoldLip,
                  {
                    width: displayWidth - outerH * 2 - bodyH * 2 - innerH * 2,
                    height: displayHeight - outerV * 2 - bodyV * 2 - innerV * 2,
                    paddingHorizontal: goldH,
                    paddingVertical: goldV,
                  },
                ]}
              >
                {/* Matte/mount around image */}
                <View
                  style={[
                    styles.frameMatte,
                    {
                      width: imageDisplayWidth + matteH * 2,
                      height: imageDisplayHeight + matteV * 2,
                      paddingHorizontal: matteH,
                      paddingVertical: matteV,
                    },
                  ]}
                >
                  {/* Canvas/image area */}
                  <View
                    style={[
                      styles.canvasArea,
                      {
                        width: imageDisplayWidth,
                        height: imageDisplayHeight,
                      },
                    ]}
                  >
                    {isLoading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#999" />
                      </View>
                    )}
                    <GestureDetector gesture={composedGesture}>
                      <Animated.Image
                        source={source}
                        style={[
                          styles.image,
                          { width: imageDisplayWidth, height: imageDisplayHeight },
                          animatedStyle,
                        ]}
                        resizeMode={resizeMode}
                        onLoadEnd={handleLoadEnd}
                        onError={handleError}
                      />
                    </GestureDetector>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    // Dimensions set inline based on calculated values
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  // Elegant picture frame styles
  frameContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameShadow: {
    justifyContent: 'center',
    alignItems: 'center',
    // Deep shadow for wall-hanging effect
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  frameOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C1810', // Very dark wood edge
    borderRadius: 2,
    // Highlight on top-left edge
    borderWidth: 1,
    borderTopColor: '#4A3728',
    borderLeftColor: '#4A3728',
    borderRightColor: '#1A0F0A',
    borderBottomColor: '#1A0F0A',
  },
  frameBody: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5D4037', // Rich brown wood
    borderRadius: 1,
    // Wood grain highlight effect
    borderWidth: 2,
    borderTopColor: '#8D6E63',
    borderLeftColor: '#795548',
    borderRightColor: '#3E2723',
    borderBottomColor: '#3E2723',
  },
  frameInnerEdge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E342E', // Darker inner edge - creates depth
    // Inner shadow effect
    borderWidth: 1,
    borderTopColor: '#3E2723',
    borderLeftColor: '#3E2723',
    borderRightColor: '#6D4C41',
    borderBottomColor: '#6D4C41',
  },
  frameGoldLip: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C9A227', // Antique gold
    borderWidth: 1,
    borderTopColor: '#E8D48B',
    borderLeftColor: '#D4B84A',
    borderRightColor: '#8B7020',
    borderBottomColor: '#8B7020',
  },
  frameMatte: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0', // Off-white matte
    // Subtle texture
    borderWidth: 1,
    borderColor: '#E8E8E0',
  },
  canvasArea: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    // Slight inset shadow
    borderWidth: 1,
    borderTopColor: '#D0D0D0',
    borderLeftColor: '#D0D0D0',
    borderRightColor: '#F0F0F0',
    borderBottomColor: '#F0F0F0',
  },
});
