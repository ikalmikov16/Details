import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { tapLight } from '../utils/haptics';
import { getComputedStats } from '../utils/storage';

export default function StatsScreen({ navigation }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const computedStats = await getComputedStats();
    setStats(computedStats);
  }, []);

  // Reload stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getPositionEmoji = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  if (!stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasPlayedGames = stats.gamesPlayed > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Overview</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={styles.statEmoji}>🎮</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.gamesPlayed}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Games Played</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.wins}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wins</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={styles.statEmoji}>📈</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.winRate}%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.averageScore}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Best Score */}
        {stats.bestScore > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🌟 Best Score</Text>
            <View style={[styles.bestScoreCard, { backgroundColor: theme.primary + '20' }]}>
              <Text style={styles.bestScoreValue}>{stats.bestScore}</Text>
              <Text style={[styles.bestScoreTopic, { color: theme.text }]}>
                {stats.bestScoreTopic || 'Unknown Topic'}
              </Text>
            </View>
          </View>
        )}

        {/* Recent Games */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🕐 Recent Games</Text>

          {!hasPlayedGames ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={styles.emptyEmoji}>🎨</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No games played yet!
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Start playing to see your stats here.
              </Text>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  tapLight();
                  navigation.navigate('Welcome');
                }}
              >
                <Text style={styles.playButtonText}>Play Now</Text>
              </TouchableOpacity>
            </View>
          ) : stats.recentGames.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No recent games recorded.
              </Text>
            </View>
          ) : (
            <View style={styles.gamesList}>
              {stats.recentGames.map((game, index) => (
                <View
                  key={game.id || index}
                  style={[
                    styles.gameItem,
                    { backgroundColor: theme.cardBackground },
                    game.isWin && styles.winGameItem,
                    game.isWin && { borderColor: theme.success },
                  ]}
                >
                  <View style={styles.gamePosition}>
                    <Text style={styles.positionEmoji}>{getPositionEmoji(game.position)}</Text>
                  </View>
                  <View style={styles.gameInfo}>
                    <Text style={[styles.gameName, { color: theme.text }]}>
                      {game.playerName || 'You'}
                    </Text>
                    <Text style={[styles.gameDetails, { color: theme.textSecondary }]}>
                      {game.isMultiplayer ? '🌐 Multiplayer' : '📱 Single Device'} • {game.rounds}{' '}
                      rounds
                    </Text>
                  </View>
                  <View style={styles.gameRight}>
                    <Text style={[styles.gameScore, { color: theme.primary }]}>
                      {game.totalScore} pts
                    </Text>
                    <Text style={[styles.gameDate, { color: theme.textSecondary }]}>
                      {formatDate(game.date)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  bestScoreCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  bestScoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f59e0b',
  },
  bestScoreTopic: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  playButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  gamesList: {
    gap: 10,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  winGameItem: {
    borderWidth: 2,
  },
  gamePosition: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionEmoji: {
    fontSize: 22,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '700',
  },
  gameDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  gameRight: {
    alignItems: 'flex-end',
  },
  gameScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  gameDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
