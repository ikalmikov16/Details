import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { BLANK_WHITE_PNG_BASE64 } from '../utils/constants';

// Data URL format for initializing canvas with blank image
// This ensures readSignature() always returns valid data
const BLANK_CANVAS_DATA_URL = `data:image/png;base64,${BLANK_WHITE_PNG_BASE64}`;

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
    const signatureRef = useRef(null);

    // Promise resolver for toBase64 - stored here so onOK can resolve it
    const base64ResolverRef = useRef(null);

    // Track the current color - use background color for eraser effect
    const currentColor = isEraser ? backgroundColor : strokeColor;

    // Update pen color when strokeColor or isEraser changes
    useEffect(() => {
      if (signatureRef.current) {
        signatureRef.current.changePenColor(currentColor);
      }
    }, [currentColor]);

    // Update pen size when strokeWidth changes
    useEffect(() => {
      if (signatureRef.current) {
        signatureRef.current.changePenSize(strokeWidth, strokeWidth);
      }
    }, [strokeWidth]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      // Undo last stroke
      undo: (steps = 1) => {
        // SignatureCanvas undo() undoes one stroke at a time
        for (let i = 0; i < steps; i++) {
          signatureRef.current?.undo();
        }
      },

      // Clear all strokes
      reset: () => {
        signatureRef.current?.clearSignature();
      },

      // Force end/commit the current stroke if one is in progress
      // SignatureCanvas handles this automatically, but we can trigger onEnd
      endCurrentStroke: () => {
        // SignatureCanvas auto-commits strokes, nothing needed here
      },

      // Export canvas to base64
      toBase64: async (_format = 'png', _quality = 1.0) => {
        if (!signatureRef.current) return BLANK_WHITE_PNG_BASE64;
        try {
          return new Promise((resolve) => {
            // Store the resolver so handleOK can call it
            base64ResolverRef.current = resolve;
            // Trigger signature read - data comes through onOK callback
            signatureRef.current.readSignature();
            // Short timeout - if canvas is empty, onOK may not fire
            // Return blank canvas fallback so submission always works
            setTimeout(() => {
              if (base64ResolverRef.current === resolve) {
                base64ResolverRef.current = null;
                // Return blank white canvas for empty drawings
                resolve(BLANK_WHITE_PNG_BASE64);
              }
            }, 500);
          });
        } catch (error) {
          console.error('Error exporting canvas:', error);
          return BLANK_WHITE_PNG_BASE64;
        }
      },

      // Check if canvas has any strokes
      // Always return true - blank canvas is valid (user chose not to draw)
      hasContent: () => {
        return true;
      },

      // Get the underlying canvas ref for direct access if needed
      getInternalRef: () => signatureRef.current,
    }));

    // Handle signature data when ready (for toBase64)
    const handleOK = useCallback((signature) => {
      // signature is the base64 data URL (e.g., "data:image/png;base64,...")
      if (base64ResolverRef.current) {
        // Extract just the base64 part if it's a data URL
        let base64Data = signature;
        if (signature && signature.startsWith('data:')) {
          base64Data = signature.split(',')[1] || '';
        }

        // If data is empty or too short, use blank canvas fallback
        // A valid PNG is at least a few hundred characters
        if (!base64Data || base64Data.length < 100) {
          base64ResolverRef.current(BLANK_WHITE_PNG_BASE64);
        } else {
          base64ResolverRef.current(base64Data);
        }
        base64ResolverRef.current = null;
      }
    }, []);

    // Handle when drawing ends
    const handleEnd = useCallback(() => {
      if (onDrawEnd) {
        onDrawEnd();
      }
    }, [onDrawEnd]);

    // Handle when drawing begins
    const handleBegin = useCallback(() => {
      // Could trigger onDrawStart if needed
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

    // Style for the WebView canvas
    const webStyle = `.m-signature-pad {
      box-shadow: none;
      border: none;
      margin: 0;
      padding: 0;
    }
    .m-signature-pad--body {
      border: none;
      margin: 0;
      padding: 0;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
    }`;

    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleOK}
          onEnd={handleEnd}
          onBegin={handleBegin}
          penColor={currentColor}
          minWidth={strokeWidth}
          maxWidth={strokeWidth}
          backgroundColor={backgroundColor}
          webStyle={webStyle}
          style={styles.canvas}
          dotSize={strokeWidth}
          trimWhitespace={false}
          autoClear={false}
          dataURL={BLANK_CANVAS_DATA_URL}
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
    width: '100%',
    height: '100%',
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
