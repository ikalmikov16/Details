import React, { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';

// Only import FreeCanvas and Skia on native platforms - use lazy loading
let FreeCanvas = null;
let ImageFormat = null;

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
    
    // Multi-stage initialization to prevent iOS Skia/Reanimated race condition:
    // 1. Wait for container layout (native view infrastructure ready)
    // 2. Wait for interactions to complete (navigation animations done)
    // 3. Wait multiple frames for Skia native initialization
    const [layoutReady, setLayoutReady] = useState(false);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const mountedRef = useRef(true);
    
    // Handle container layout - ensures native view infrastructure exists
    const handleLayout = useCallback(() => {
      if (!layoutReady) {
        setLayoutReady(true);
      }
    }, [layoutReady]);
    
    // After layout, wait for interactions and native initialization
    React.useEffect(() => {
      if (!layoutReady || Platform.OS === 'web') return;
      
      let cancelled = false;
      
      // Lazy load the native modules only after layout is ready
      if (!FreeCanvas) {
        try {
          FreeCanvas = require('react-native-free-canvas').default;
          ImageFormat = require('@shopify/react-native-skia').ImageFormat;
        } catch (e) {
          console.error('Failed to load canvas modules:', e);
          return;
        }
      }
      
      // Wait for all interactions (navigation, etc.) to complete
      const task = InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        
        // Use requestAnimationFrame to ensure we're on a fresh frame
        // then add substantial delay for Skia native canvas provider initialization
        // iOS production builds have slower native initialization than Expo Go
        requestAnimationFrame(() => {
          if (cancelled) return;
          
          // Multiple frame delays to ensure Skia is truly ready
          setTimeout(() => {
            if (cancelled) return;
            requestAnimationFrame(() => {
              if (cancelled) return;
              if (mountedRef.current) {
                setIsCanvasReady(true);
              }
            });
          }, 300); // Longer delay for iOS production
        });
      });
      
      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [layoutReady]);

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
        if (!canvasRef.current || !ImageFormat) return null;
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

    // Cleanup on unmount
    React.useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
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

    // Show placeholder while waiting for canvas to be ready
    // This multi-stage initialization prevents the iOS Skia/Reanimated crash
    if (!isCanvasReady || !FreeCanvas) {
      return (
        <View 
          style={[styles.container, { backgroundColor }, style]} 
          onLayout={handleLayout}
        />
      );
    }

    return (
      <View style={[styles.container, style]} onLayout={handleLayout}>
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
