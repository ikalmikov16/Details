import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function WelcomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          {/* Theme Toggle Button - Top Right */}
          <TouchableOpacity 
            style={[styles.themeButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeButtonText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>🎨</Text>
            <Text style={[styles.titleText, { color: theme.text }]}>Drawing Game</Text>
            <View style={[styles.subtitleBadge, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '40' }]}>
              <Text style={[styles.subtitle, { color: theme.primary }]}>
                ✨ Draw • Rate • Compete ✨
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.modeContainer}>
          {/* Multiplayer Mode */}
          <TouchableOpacity
            style={styles.modeButtonWrapper}
            onPress={() => navigation.navigate('RoomCreate')}
            activeOpacity={0.8}
          >
            <View style={[styles.modeButton, styles.multiplayerButton]}>
              <View style={styles.iconCircle}>
                <Text style={styles.modeButtonEmoji}>🌐</Text>
              </View>
              <Text style={styles.modeButtonTitle}>Create Multiplayer</Text>
              <Text style={styles.modeButtonDesc}>
                Each player draws on their phone
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButtonWrapper}
            onPress={() => navigation.navigate('RoomJoin')}
            activeOpacity={0.8}
          >
            <View style={[styles.modeButton, styles.joinButton]}>
              <View style={styles.iconCircle}>
                <Text style={styles.modeButtonEmoji}>🚪</Text>
              </View>
              <Text style={styles.modeButtonTitle}>Join Game</Text>
              <Text style={styles.modeButtonDesc}>
                Enter room code to play
              </Text>
            </View>
          </TouchableOpacity>

          {/* Single Phone Mode */}
          <TouchableOpacity
            style={styles.modeButtonWrapper}
            onPress={() => navigation.navigate('Setup')}
            activeOpacity={0.8}
          >
            <View style={[styles.modeButton, styles.singlePhoneButton]}>
              <View style={styles.iconCircle}>
                <Text style={styles.modeButtonEmoji}>📱</Text>
              </View>
              <Text style={styles.modeButtonTitle}>Single Device</Text>
              <Text style={styles.modeButtonDesc}>
                Draw on paper, score together
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  themeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 22,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 72,
    marginBottom: 12,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeContainer: {
    gap: 18,
    paddingBottom: 10,
  },
  modeButtonWrapper: {
    borderRadius: 24,
  },
  modeButton: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  multiplayerButton: {
    backgroundColor: '#6366f1',
  },
  joinButton: {
    backgroundColor: '#10b981',
  },
  singlePhoneButton: {
    backgroundColor: '#f59e0b',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modeButtonEmoji: {
    fontSize: 40,
  },
  modeButtonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modeButtonDesc: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '600',
    lineHeight: 20,
  },
});
