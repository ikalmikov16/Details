import React, { forwardRef, memo, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// Only import FreeCanvas and Skia on native platforms
let FreeCanvas = null;
let ImageFormat = null;
if (Platform.OS !== 'web') {
  FreeCanvas = require('react-native-free-canvas').default;
  ImageFormat = require('@shopify/react-native-skia').ImageFormat;
}

const EnhancedDrawingCanvas = forwardRef(
  (
    {
      strokeColor = '#000000',
      strokeWidth = 4,
      backgroundColor = '#FFFFFF',
      isEraser = false,
      onDrawEnd,
      style,
    },
    ref
  ) => {
    const canvasRef = useRef(null);

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

      // Force end/commit the current stroke if one is in progress
      // This is needed when timer runs out while user is still drawing
      endCurrentStroke: () => {
        try {
          // Try various methods that different canvas implementations might have
          if (canvasRef.current?.endStroke) {
            canvasRef.current.endStroke();
          } else if (canvasRef.current?.finishPath) {
            canvasRef.current.finishPath();
          } else if (canvasRef.current?.commitCurrentPath) {
            canvasRef.current.commitCurrentPath();
          }
          // Also try to flush the Skia surface if accessible
          if (canvasRef.current?.flush) {
            canvasRef.current.flush();
          }
        } catch (_e) {
          // Silent fail - method might not exist
        }
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

      // Get the underlying canvas ref for direct access if needed
      getInternalRef: () => canvasRef.current,
    }));

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
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          backgroundColor={backgroundColor}
          zoomable={false}
          onDrawEnd={onDrawEnd}
        />
      </View>
    );
  }
);

EnhancedDrawingCanvas.displayName = 'EnhancedDrawingCanvas';

// Memoize to prevent re-renders from parent state changes (timer, etc.)
const MemoizedEnhancedDrawingCanvas = memo(EnhancedDrawingCanvas);

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

export default MemoizedEnhancedDrawingCanvas;
