import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, useColorScheme, ImageSourcePropType, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { fetchTopLeagues, fetchCurrentLeague, fetchLeaguePlayers, top100Players } from '../../api/league';
import { getLeagueAirspace } from '../../components/player';
import { getPalette, Spacing, Radius, Type, cardShadow, type ThemePalette } from '../../components/ui/theme';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PressableScale } from '../../components/ui/PressableScale';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { Avatar } from '../../components/ui/Avatar';

const DEFAULT_IMAGE = require('../../assets/mapassets/Female_Avatar_PNG.png');
const LEAGUE_IMAGE = require('../../assets/onboarding/leagues.png');

const LEAGUE_IMAGES: { [key: string]: ImageSourcePropType } = {
  'Bronze': require('../../assets/leagues/bronze.png'),
  'Silver': require('../../assets/leagues/silver.png'),
  'Gold': require('../../assets/leagues/gold.png'),
  'Diamond': require('../../assets/leagues/diamond.png'),
  'Legend': require('../../assets/leagues/legend.png'),
};

// Medal colours for the top three rank badges.
const MEDAL_COLORS = ['#F7B733', '#A8B2C3', '#CD7F32'];

interface Player {
  id: string;
  username: string;
  points: number;
  isCurrentUser: boolean;
  profileImageUrl?: string | null;
}

interface League {
  name: string;
  playerCount: number;
}


const LeagueRankingPage: React.FC = () => {
  const [topLeagues, setTopLeagues] = useState<League[]>([]);
  const [leaguePlayers, setLeaguePlayers] = useState<Player[]>([]);
  const [currentLeague, setCurrentLeague] = useState<{ division: string; league: string } | null>(null);
  const [viewMode, setViewMode] = useState<'players' | 'leagues'>('leagues');
  const [isLoading, setIsLoading] = useState(true);
  const [top100, setTop100] = useState<Player[]>([]);

  const isDarkMode = useColorScheme() === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getStyles(palette, isDarkMode);

  const getLeagueImage = (leagueName: string): ImageSourcePropType => {
    // League names often carry a division suffix ("Bronze 1"), so match the
    // base tier rather than the exact string.
    const tier = Object.keys(LEAGUE_IMAGES).find((key) => leagueName.startsWith(key));
    return (tier && LEAGUE_IMAGES[tier]) || require('../../assets/leagues/default.png');
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [topLeaguesData, currentLeagueData, leaguePlayersResponse, top100Data] = await Promise.all([
          fetchTopLeagues(),
          fetchCurrentLeague(),
          fetchLeaguePlayers(),
          top100Players()
        ]);

        // profileImageUrl is resolved server-side and already present on each player.
        setTopLeagues(topLeaguesData.leagues);
        setCurrentLeague(currentLeagueData);
        setLeaguePlayers(leaguePlayersResponse.players);
        setTop100(top100Data.players);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const navigateToProfile = (username: string) => {
    router.navigate({
      pathname: "/profile/user-profile",
      params: { username }
    });
  };

  const renderRankBadge = (index: number) => {
    const medal = index < 3 ? MEDAL_COLORS[index] : undefined;
    return (
      <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
        <Text style={[styles.rankBadgeText, medal ? styles.rankBadgeTextMedal : null]}>
          {index + 1}
        </Text>
      </View>
    );
  };

  const renderPlayerRow = (player: Player, index: number) => (
    <AnimatedEntrance key={player.id} index={index} stagger={20}>
      <PressableScale
        haptic="select"
        style={[styles.row, player.isCurrentUser && styles.currentUserRow]}
        onPress={() => navigateToProfile(player.username)}
      >
        {renderRankBadge(index)}
        <Avatar
          uri={player.profileImageUrl}
          style={styles.profilePic}
          contentFit="cover"
          transition={200}
          placeholder={DEFAULT_IMAGE}
        />
        <Text
          style={[styles.username, player.isCurrentUser && styles.currentUserText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {player.username}{player.isCurrentUser ? ' (You)' : ''}
        </Text>
        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>{player.points} pts</Text>
        </View>
      </PressableScale>
    </AnimatedEntrance>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Image
              source={LEAGUE_IMAGE}
              style={styles.loadingImage}
              contentFit="contain"
              transition={300}
              cachePolicy="memory-disk"
            />
            <ActivityIndicator size="large" color={palette.accent} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading rankings...</Text>
            <Text style={styles.loadingSubtext}>Preparing your league data</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rankings</Text>
        <Text style={styles.headerSubtitle}>Climb the leagues, earn your airspace</Text>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl
          palette={palette}
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'leagues', label: 'My League', icon: 'trophy' },
            { value: 'players', label: 'Top 100', icon: 'podium' },
          ]}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {viewMode === 'leagues' ? (
          <>
            {currentLeague && (
              <AnimatedEntrance>
                <View style={styles.heroCard}>
                  <View style={styles.heroImageWrap}>
                    <Image
                      source={getLeagueImage(currentLeague.league)}
                      style={styles.heroImage}
                      contentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  </View>
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroEyebrow}>Your current league</Text>
                    <Text style={styles.heroLeague}>{currentLeague.league}</Text>
                    <Text style={styles.heroDivision}>Division {currentLeague.division}</Text>
                    <View style={styles.airspacePill}>
                      <Ionicons name="radio-outline" size={14} color={palette.accent} />
                      <Text style={styles.airspaceText}>{getLeagueAirspace(currentLeague.league)} m airspace</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.airspaceDescription}>
                  Airspace is a zone around you that gives you sooner alerts when a missile is approaching or passing nearby.
                </Text>
              </AnimatedEntrance>
            )}

            <Text style={styles.sectionTitle}>Players in your league</Text>
            <View style={styles.sectionCard}>
              {leaguePlayers.length > 0 ? (
                leaguePlayers
                  .sort((a, b) => b.points - a.points)
                  .map((player, index) => renderPlayerRow(player, index))
              ) : (
                <Text style={styles.noDataText}>No players available</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Top leagues</Text>
            <View style={styles.sectionCard}>
              {Array.isArray(topLeagues) && topLeagues.length > 0 ? (
                topLeagues.map((league, index) => (
                  <AnimatedEntrance key={index} index={index} stagger={20}>
                    <View style={styles.row}>
                      {renderRankBadge(index)}
                      <View style={styles.leagueIconWrap}>
                        <Image
                          source={getLeagueImage(league.name)}
                          style={styles.leagueIcon}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
                      </View>
                      <Text style={styles.username}>{league.name}</Text>
                      <View style={styles.pointsPill}>
                        <Ionicons name="people" size={12} color={palette.accent} />
                        <Text style={styles.pointsText}>{league.playerCount}</Text>
                      </View>
                    </View>
                  </AnimatedEntrance>
                ))
              ) : (
                <Text style={styles.noDataText}>No leagues available</Text>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Top 100 players</Text>
            <View style={styles.sectionCard}>
              {Array.isArray(top100) && top100.length > 0 ? (
                top100.map((player, index) => renderPlayerRow(player, index))
              ) : (
                <Text style={styles.noDataText}>No players available</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Type.display,
    color: palette.text,
  },
  headerSubtitle: {
    ...Type.caption,
    fontWeight: '400',
    color: palette.textMuted,
    marginTop: 2,
  },
  segmentWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: Spacing.lg,
    ...cardShadow(isDark),
  },
  heroImageWrap: {
    width: 92,
    height: 92,
    borderRadius: Radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 76,
    height: 76,
  },
  heroInfo: {
    flex: 1,
  },
  heroEyebrow: {
    ...Type.micro,
    color: palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroLeague: {
    ...Type.title,
    fontSize: 24,
    color: palette.text,
    marginTop: 2,
  },
  heroDivision: {
    ...Type.caption,
    fontWeight: '500',
    color: palette.textMuted,
    marginTop: 2,
  },
  airspacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
    backgroundColor: palette.accentSoft,
  },
  airspaceText: {
    ...Type.caption,
    color: palette.accent,
  },
  airspaceDescription: {
    ...Type.caption,
    fontWeight: '400',
    color: palette.textFaint,
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  sectionTitle: {
    ...Type.micro,
    fontSize: 12,
    color: palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...cardShadow(isDark),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  currentUserRow: {
    backgroundColor: palette.accentSoft,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
    borderBottomWidth: 0,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    ...Type.micro,
    fontSize: 12,
    color: palette.textMuted,
  },
  rankBadgeTextMedal: {
    color: '#FFFFFF',
  },
  profilePic: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surfaceAlt,
  },
  username: {
    flex: 1,
    ...Type.headline,
    fontSize: 15,
    color: palette.text,
  },
  currentUserText: {
    color: palette.accent,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
    backgroundColor: palette.surfaceAlt,
  },
  pointsText: {
    ...Type.caption,
    color: palette.accent,
  },
  leagueIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueIcon: {
    width: 30,
    height: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingCard: {
    backgroundColor: palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: Spacing.xxl,
    alignItems: 'center',
    minWidth: 280,
    ...cardShadow(isDark),
  },
  loadingImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
  },
  loadingSpinner: {
    marginBottom: Spacing.md,
  },
  loadingText: {
    ...Type.headline,
    color: palette.text,
    marginBottom: Spacing.xs,
  },
  loadingSubtext: {
    ...Type.caption,
    fontWeight: '400',
    color: palette.textMuted,
  },
  noDataText: {
    ...Type.body,
    color: palette.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default LeagueRankingPage;
