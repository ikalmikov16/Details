import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Banner that shows when offline
 */
export function OfflineBanner({ visible }) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.danger }]}>
      <Text style={styles.bannerText}>⚠️ No connection - trying to reconnect...</Text>
    </View>
  );
}

/**
 * Loading overlay with spinner
 */
export function LoadingOverlay({ visible, message = 'Loading...' }) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.loadingCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={styles.loadingEmoji}>⏳</Text>
        <Text style={[styles.loadingText, { color: theme.text }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingEmoji: {
    fontSize: 40,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
