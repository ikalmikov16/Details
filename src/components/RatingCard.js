import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { selection, success } from '../utils/haptics';
import ZoomableImage from './ZoomableImage';

/**
 * RatingCard - A fullscreen card showing one drawing with slider rating
 * Used in the horizontal swipe rating flow
 *
 * If isOwnDrawing is true, shows the drawing without rating controls
 */
export default function RatingCard({
  player,
  drawingUrl,
  currentRating,
  onRatingChange,
  disabled = false,
  isOwnDrawing = false,
}) {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Only enable scroll when content overflows
  const handleContainerLayout = useCallback((e) => {
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback((width, height) => {
    setContentHeight(height);
  }, []);

  useEffect(() => {
    if (containerHeight > 0 && contentHeight > 0) {
      setScrollEnabled(contentHeight > containerHeight);
    }
  }, [containerHeight, contentHeight]);

  // Use a consistent fixed height to prevent layout shifts
  // This gives a good balance for most phone screen drawings
  const defaultImageHeight = isOwnDrawing ? screenHeight * 0.45 : screenHeight * 0.38;
  const imageHeight = defaultImageHeight;

  const handleRatingChange = (value) => {
    if (disabled || isOwnDrawing) return;
    const score = Math.round(value);
    if (currentRating !== score) {
      selection();
    }
    onRatingChange(score);
  };

  const handleSave = async () => {
    if (!drawingUrl || isSaving) return;

    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save images to your device.');
        setIsSaving(false);
        return;
      }

      const filename = `drawing_${player.name}_${Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(drawingUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      success();
      Alert.alert('Saved!', `${player.name}'s drawing saved to your photos.`);
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!drawingUrl || isSharing) return;

    setIsSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        setIsSharing(false);
        return;
      }

      const filename = `drawing_${player.name}_${Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(drawingUrl, fileUri);

      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/png',
        dialogTitle: `${player.name}'s Drawing`,
      });

      success();
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={[styles.container, { width: screenWidth }]} onLayout={handleContainerLayout}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        bounces={scrollEnabled}
        onContentSizeChange={handleContentSizeChange}
      >
        {/* Card title */}
        <View style={styles.headerRow}>
          <Text style={[styles.playerName, { color: theme.text }]}>
            {isOwnDrawing ? 'Your Drawing' : `Rate ${player.name}'s Drawing`}
          </Text>
        </View>

        {/* Drawing with pinch-to-zoom */}
        <View
          style={[
            styles.drawingContainer,
            {
              backgroundColor: '#fff',
              height: imageHeight,
            },
          ]}
        >
          {drawingUrl ? (
            <ZoomableImage
              source={{ uri: drawingUrl }}
              style={{ height: imageHeight }}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.noDrawing, { backgroundColor: theme.border }]}>
              <Text style={[styles.noDrawingText, { color: theme.textSecondary }]}>
                No drawing submitted
              </Text>
            </View>
          )}
        </View>

        {/* Share/Save buttons */}
        {drawingUrl && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
              onPress={handleShare}
              disabled={isSharing}
              activeOpacity={0.7}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.actionButtonText, { color: theme.text }]}>📤 Share</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.actionButtonText, { color: theme.text }]}>💾 Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Rating section - only show for other players' drawings */}
        {!isOwnDrawing && (
          <View
            style={[
              styles.ratingSection,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.ratingHeader}>
              <Text style={[styles.ratingLabel, { color: theme.textSecondary }]}>Your Rating:</Text>
              <View style={[styles.ratingBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.ratingValue}>{currentRating ?? 0}</Text>
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={currentRating ?? 0}
              onValueChange={handleRatingChange}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
              disabled={disabled}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>0 - Poor</Text>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>
                10 - Excellent
              </Text>
            </View>
          </View>
        )}

        {/* Message for own drawing */}
        {isOwnDrawing && (
          <View style={[styles.ownDrawingMessage, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.ownDrawingText, { color: theme.textSecondary }]}>
              This is your drawing - swipe to rate others! 👉
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  drawingContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  noDrawing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  noDrawingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 110,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  ratingSection: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  ratingBadge: {
    minWidth: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  slider: {
    width: '100%',
    height: 50,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  ownDrawingMessage: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  ownDrawingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
