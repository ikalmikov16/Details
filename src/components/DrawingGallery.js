import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { success, tapLight } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const NUM_COLUMNS = 2;
const THUMBNAIL_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

/**
 * DrawingGallery - Modal displaying all drawings in a grid with fullscreen view
 */
export default function DrawingGallery({ visible, onClose, drawings, players }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Create array of drawings from all rounds with player info
  const drawingsList = [];

  // drawings structure: { round1: { playerId: { url, ... } }, round2: { ... }, ... }
  if (drawings) {
    Object.keys(drawings)
      .sort() // Sort by round number
      .forEach((roundKey) => {
        const roundNum = roundKey.replace('round', '');
        const roundDrawings = drawings[roundKey] || {};

        Object.keys(roundDrawings).forEach((playerId) => {
          const drawing = roundDrawings[playerId];
          const player = players.find((p) => p.id === playerId);

          if (drawing?.url && player) {
            drawingsList.push({
              playerId,
              playerName: player.name,
              url: drawing.url,
              round: parseInt(roundNum, 10),
              key: `${roundKey}-${playerId}`,
            });
          }
        });
      });
  }

  const handleSave = async (drawing) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save images to your device.');
        setIsSaving(false);
        return;
      }

      const filename = `drawing_${drawing.playerName}_${Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(drawing.url, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      success();
      Alert.alert('Saved!', `${drawing.playerName}'s drawing saved to your photos.`);
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (drawing) => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        setIsSharing(false);
        return;
      }

      const filename = `drawing_${drawing.playerName}_${Date.now()}.png`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(drawing.url, fileUri);

      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/png',
        dialogTitle: `${drawing.playerName}'s Drawing`,
      });

      success();
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save images to your device.');
        setIsSaving(false);
        return;
      }

      let savedCount = 0;
      for (const drawing of drawingsList) {
        try {
          const filename = `drawing_${drawing.playerName}_${Date.now()}.png`;
          const fileUri = FileSystem.cacheDirectory + filename;

          const downloadResult = await FileSystem.downloadAsync(drawing.url, fileUri);
          await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
          savedCount++;
        } catch (err) {
          console.error(`Error saving ${drawing.playerName}'s drawing:`, err);
        }
      }

      success();
      Alert.alert('Saved!', `${savedCount} drawings saved to your photos.`);
    } catch (error) {
      console.error('Error saving images:', error);
      Alert.alert('Error', 'Failed to save images. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.border }]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: theme.primary }]}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>All Drawings</Text>
          <TouchableOpacity
            onPress={handleSaveAll}
            style={styles.saveAllButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.saveAllButtonText, { color: theme.primary }]}>Save All</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.grid}>
          {drawingsList.map((drawing) => (
            <TouchableOpacity
              key={drawing.key}
              style={[styles.thumbnailContainer, { backgroundColor: theme.cardBackground }]}
              onPress={() => {
                tapLight();
                setSelectedDrawing(drawing);
              }}
              activeOpacity={0.8}
            >
              <Image source={{ uri: drawing.url }} style={styles.thumbnail} resizeMode="cover" />
              <View style={[styles.roundBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.roundBadgeText}>R{drawing.round}</Text>
              </View>
              <View style={[styles.playerLabel, { backgroundColor: theme.background + 'E0' }]}>
                <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
                  {drawing.playerName}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Fullscreen view */}
        <Modal visible={!!selectedDrawing} transparent animationType="fade">
          <View style={styles.fullscreenContainer}>
            <TouchableOpacity
              style={styles.fullscreenBackground}
              activeOpacity={1}
              onPress={() => setSelectedDrawing(null)}
            />

            {selectedDrawing && (
              <View style={styles.fullscreenContent}>
                <Text style={styles.fullscreenPlayerName}>
                  {selectedDrawing.playerName} • Round {selectedDrawing.round}
                </Text>
                <Image
                  source={{ uri: selectedDrawing.url }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />

                <View style={styles.fullscreenActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShare(selectedDrawing)}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>📤 Share</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSave(selectedDrawing)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>💾 Save</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.fullscreenClose}
                  onPress={() => setSelectedDrawing(null)}
                >
                  <Text style={styles.fullscreenCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveAllButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_PADDING,
    gap: GRID_GAP,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE + 36,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: THUMBNAIL_SIZE,
    backgroundColor: '#fff',
  },
  roundBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roundBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  playerLabel: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  fullscreenContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenPlayerName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  fullscreenImage: {
    width: '100%',
    height: '60%',
  },
  fullscreenActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
});
