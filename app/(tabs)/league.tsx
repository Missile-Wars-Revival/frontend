import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, useColorScheme, ImageSourcePropType, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchTopLeagues, fetchCurrentLeague, fetchLeaguePlayers, top100Players } from '../../api/league';
import { fetchAndCacheImage } from '../../util/imagecache'; 
import { getLeagueAirspace } from '../../components/player';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_IMAGE = require('../../assets/mapassets/Female_Avatar_PNG.png');

const LEAGUE_IMAGES: { [key: string]: ImageSourcePropType } = {
  'Bronze': require('../../assets/leagues/bronze.png'),
  'Silver': require('../../assets/leagues/silver.png'),
  'Gold': require('../../assets/leagues/gold.png'),
  'Diamond': require('../../assets/leagues/diamond.png'),
  'Legend': require('../../assets/leagues/legend.png'),
};

interface Player {
  id: string;
  username: string;
  points: number;
  isCurrentUser: boolean;
  profileImageUrl?: string;
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
  const [isAdFree, setIsAdFree] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [adLoaded, setAdLoaded] = useState(false);
  
  const scheme = useColorScheme() || 'light';
  const styles = StyleSheet.create({
    ...lightStyles,
    ...(scheme === 'dark' ? darkStyles : {}),
  });

  const getLeagueImage = (leagueName: string): ImageSourcePropType => {
    return LEAGUE_IMAGES[leagueName] || require('../../assets/leagues/default.png');
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

        // Fetch and cache profile images for league players
        const leaguePlayersWithImages = await Promise.all(
          leaguePlayersResponse.players.map(async (player: { username: string; }) => ({
            ...player,
            profileImageUrl: await fetchAndCacheImage(player.username),
          }))
        );

        // Fetch and cache profile images for top 100 players
        const top100WithImages = await Promise.all(
          top100Data.players.map(async (player: { username: string; }) => ({
            ...player,
            profileImageUrl: await fetchAndCacheImage(player.username),
          }))
        );

        setTopLeagues(topLeaguesData.leagues);
        setCurrentLeague(currentLeagueData);
        setLeaguePlayers(leaguePlayersWithImages);
        setTop100(top100WithImages);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    checkAdFreeStatus();
  }, []);

  const checkAdFreeStatus = async () => {
    try {
      const storedAdFreeStatus = await AsyncStorage.getItem('isAdFree');
      if (storedAdFreeStatus !== null) {
        setIsAdFree(JSON.parse(storedAdFreeStatus));
      }
    } catch (error) {
      console.error('Error fetching ad-free status:', error);
    }
  };

  const navigateToProfile = (username: string) => {
    router.navigate({
      pathname: "/user-profile",
      params: { username }
    });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'players' ? 'leagues' : 'players');
  };

  const renderPlayerRow = (player: Player, index: number) => (
    <TouchableOpacity
      key={player.id}
      style={[styles.row, player.isCurrentUser && styles.currentUserRow]}
      onPress={() => navigateToProfile(player.username)}
    >
      <Text style={styles.rankNumber}>{index + 1}</Text>
      <Image 
        source={player.profileImageUrl ? { uri: player.profileImageUrl } : DEFAULT_IMAGE}
        style={styles.profilePic}
      />
      <Text style={[styles.username, player.isCurrentUser && styles.currentUserText]}>
        {player.username} {player.isCurrentUser && '(You)'}
      </Text>
      <Text style={styles.points}>{player.points} pts</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Rankings</Text>
        <TouchableOpacity onPress={toggleViewMode} style={styles.headerButton}>
          <Ionicons 
            name={viewMode === 'players' ? 'trophy-outline' : 'people-outline'} 
            size={24} 
            color={scheme === 'dark' ? '#FFF' : '#FFF'} 
          />
          <Text style={styles.headerButtonText}>{viewMode === 'players' ? 'Leagues' : 'Players'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {viewMode === 'leagues' ? (
          <>
            {currentLeague && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Current League</Text>
                <View style={styles.currentLeagueContainer}>
                  <Image
                    source={getLeagueImage(currentLeague.league)}
                    style={styles.leagueImage}
                  />
                  <View style={styles.leagueInfo}>
                    <Text style={styles.currentLeagueName}>{currentLeague.league}</Text>
                    <Text style={styles.currentLeagueDivision}>Division {currentLeague.division}</Text>
                  </View>
                </View>

                <View style={styles.spacer} />

                <Text style={styles.leagueAirspace}>
                  Your current airspace: {getLeagueAirspace(currentLeague.league)} m
                </Text>
                <Text style={styles.airspaceDescription}>
                  Airspace is a zone around you that gives you sooner alerts when a missile is approaching or passing nearby.
                </Text>
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Players in Your League</Text>
              {leaguePlayers.length > 0 ? (
                leaguePlayers
                  .sort((a, b) => b.points - a.points)
                  .map((player, index) => renderPlayerRow(player, index))
              ) : (
                <Text style={styles.noDataText}>No players available</Text>
              )}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Leagues</Text>
              {Array.isArray(topLeagues) && topLeagues.length > 0 ? (
                topLeagues.map((league, index) => (
                  <View key={index} style={styles.row}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <View style={styles.leagueInfo}>
                      <Text style={styles.leagueName}>{league.name}</Text>
                      <Text style={styles.leagueTopPlayer}>
                        Players: {league.playerCount}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No leagues available</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 100 Players</Text>
            {Array.isArray(top100) && top100.length > 0 ? (
              top100.map((player, index) => renderPlayerRow(player, index))
            ) : (
              <Text style={styles.noDataText}>No players available</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4a5568',
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#ffffff',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2d3748',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentUserRow: {
    backgroundColor: '#e6f7ff',
  },
  rankNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  currentUserText: {
    fontWeight: 'bold',
    color: '#1890ff',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  leagueTopPlayer: {
    fontSize: 14,
    color: '#666',
  },
  leagueDivision: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  currentLeagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  leagueImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  currentLeagueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  currentLeagueDivision: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  spacer: {
    height: 10,
  },
  leagueDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  leagueAirspace: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  airspaceDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  footerAdContainer: {
    width: '100%',
    height: 50, // Adjust based on your banner ad size
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dismissAdButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 1,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2C2C2C',
  },
  headerText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#FFF',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  currentUserRow: {
    backgroundColor: '#3D3D3D',
  },
  rankNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  currentUserText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  leagueTopPlayer: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  leagueDivision: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 10,
  },
  currentLeagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D3D3D',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  leagueImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  currentLeagueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  currentLeagueDivision: {
    fontSize: 18,
    color: '#B0B0B0',
    marginTop: 5,
  },
  leagueDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 10,
    marginBottom: 5,
  },
  leagueAirspace: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  airspaceDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  footerAdContainer: {
    width: '100%',
    height: 50, // Adjust based on your banner ad size
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dismissAdButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 1,
  },
});

export default LeagueRankingPage;