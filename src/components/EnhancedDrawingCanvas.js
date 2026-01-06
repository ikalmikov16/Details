import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

// Only import FreeCanvas and Skia on native platforms
let FreeCanvas = null;
let ImageFormat = null;
if (Platform.OS !== 'web') {
  FreeCanvas = require('react-native-free-canvas').default;
  ImageFormat = require('@shopify/react-native-skia').ImageFormat;
}

const EnhancedDrawingCanvas = forwardRef(
  (
    { strokeColor = '#000000', strokeWidth = 4, backgroundColor = '#FFFFFF', onDrawEnd, style },
    ref
  ) => {
    const canvasRef = useRef(null);

    // Use shared values for reactive stroke color/width
    const strokeColorValue = useSharedValue(strokeColor);
    const strokeWidthValue = useSharedValue(strokeWidth);

    // Update shared values when props change
    React.useEffect(() => {
      strokeColorValue.value = strokeColor;
    }, [strokeColor, strokeColorValue]);

    React.useEffect(() => {
      strokeWidthValue.value = strokeWidth;
    }, [strokeWidth, strokeWidthValue]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      // Undo last stroke
      undo: (steps = 1) => {
        canvasRef.current?.undo(steps);
      },

      // Clear all strokes
      reset: () => {
        canvasRef.current?.reset();
      },

      // Export canvas to base64
      toBase64: async (format = 'png', quality = 1.0) => {
        if (!canvasRef.current) return null;
        try {
          // ImageFormat is an enum: PNG = 0, JPEG = 1, WEBP = 2
          const imageFormat = format === 'jpeg' ? ImageFormat.JPEG : ImageFormat.PNG;
          const base64 = await canvasRef.current.toBase64(imageFormat, quality);
          return base64;
        } catch (error) {
          console.error('Error exporting canvas:', error);
          return null;
        }
      },

      // Check if canvas has any strokes
      hasContent: () => {
        const paths = canvasRef.current?.toPaths?.();
        return paths && paths.length > 0;
      },
    }));

    // Smooth path effect for nicer lines
    const pathEffect = useMemo(() => {
      if (Platform.OS === 'web') return null;
      const { CornerPathEffect } = require('@shopify/react-native-skia');
      return <CornerPathEffect r={16} />;
    }, []);

    // Web fallback - show message that drawing isn't supported
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.container, styles.webFallback, style]}>
          <View style={styles.webFallbackContent}>
            <View style={styles.webFallbackText}>
              {/* Web fallback handled by parent component */}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <FreeCanvas
          ref={canvasRef}
          style={styles.canvas}
          strokeColor={strokeColorValue}
          strokeWidth={strokeWidthValue}
          backgroundColor={backgroundColor}
          pathEffect={pathEffect}
          zoomable={false}
          onDrawEnd={onDrawEnd}
        />
      </View>
    );
  }
);

EnhancedDrawingCanvas.displayName = 'EnhancedDrawingCanvas';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  webFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFallbackContent: {
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    alignItems: 'center',
  },
});

export default EnhancedDrawingCanvas;
