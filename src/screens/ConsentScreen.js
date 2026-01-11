import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { success as hapticSuccess, tapLight, tapMedium } from '../utils/haptics';
import { saveConsentWithTimestamp } from '../utils/storage';

const PRIVACY_POLICY_URL = 'https://gist.github.com/ikalmikov16/61dfc8c74af7c05d3006c3fe12240e02';

export default function ConsentScreen({ onConsentGiven }) {
  const { theme } = useTheme();
  const [isAccepting, setIsAccepting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleOpenPrivacyPolicy = () => {
    tapLight();
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    tapMedium();

    const saved = await saveConsentWithTimestamp(true);
    if (saved) {
      hapticSuccess();
      onConsentGiven();
    } else {
      setIsAccepting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.emoji}>🎨</Text>
            <Text style={[styles.title, { color: theme.text }]}>Welcome to SketchOff!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Before we begin, please review our data practices
            </Text>
          </View>

          {/* Info Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              📋 What We Collect for Multiplayer
            </Text>

            <View style={styles.bulletContainer}>
              <BulletPoint
                emoji="👤"
                title="Display Name"
                description="Your nickname is shared with players in your game room"
                theme={theme}
              />
              <BulletPoint
                emoji="🖼️"
                title="Drawings"
                description="Your drawings are temporarily stored for other players to rate"
                theme={theme}
              />
              <BulletPoint
                emoji="⭐"
                title="Scores"
                description="Game scores are shared within your game room during play"
                theme={theme}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.cardTitle, { color: theme.text }]}>🔒 Your Privacy</Text>

            <View style={styles.bulletContainer}>
              <BulletPoint
                emoji="✅"
                title="Temporary Storage"
                description="Game room data is deleted after the game ends"
                theme={theme}
              />
              <BulletPoint
                emoji="✅"
                title="Anonymous"
                description="No email, real name, or personal information required"
                theme={theme}
              />
              <BulletPoint
                emoji="✅"
                title="Local Stats"
                description="Your personal statistics stay on your device only"
                theme={theme}
              />
            </View>
          </View>

          {/* Privacy Policy Link */}
          <TouchableOpacity
            style={[styles.policyLink, { borderColor: theme.primary + '40' }]}
            onPress={handleOpenPrivacyPolicy}
            activeOpacity={0.7}
          >
            <Text style={[styles.policyLinkText, { color: theme.primary }]}>
              📄 Read Full Privacy Policy
            </Text>
            <Text style={[styles.policyLinkArrow, { color: theme.primary }]}>→</Text>
          </TouchableOpacity>

          {/* Consent Text */}
          <Text style={[styles.consentText, { color: theme.textSecondary }]}>
            By tapping &quot;Accept &amp; Continue&quot;, you agree to our Privacy Policy and
            consent to the collection of data as described above for multiplayer functionality.
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            style={[
              styles.acceptButton,
              { backgroundColor: theme.success },
              isAccepting && styles.buttonDisabled,
            ]}
            onPress={handleAccept}
            disabled={isAccepting}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>
              {isAccepting ? 'Starting...' : '✓ Accept & Continue'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            You can play single-device mode offline without data collection. Multiplayer requires
            the data practices described above.
          </Text>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function BulletPoint({ emoji, title, description, theme }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletEmoji}>{emoji}</Text>
      <View style={styles.bulletTextContainer}>
        <Text style={[styles.bulletTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.bulletDesc, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  bulletContainer: {
    gap: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletEmoji: {
    fontSize: 22,
    marginRight: 14,
    marginTop: 2,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bulletDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  policyLinkText: {
    fontSize: 16,
    fontWeight: '700',
  },
  policyLinkArrow: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  consentText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  acceptButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
