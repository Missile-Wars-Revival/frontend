import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchTopLeagues, fetchCurrentLeague, fetchLeaguePlayers, League, Player } from '../api/league';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

const LeagueRankingPage: React.FC = () => {
  const [topLeagues, setTopLeagues] = useState<League[]>([]);
  const [leaguePlayers, setLeaguePlayers] = useState<Player[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [viewMode, setViewMode] = useState<'players' | 'leagues'>('leagues');
  const [isLoading, setIsLoading] = useState(true);
  
  const scheme = useColorScheme();
  const styles = scheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [topLeaguesData, currentLeagueData, leaguePlayersData] = await Promise.all([
        fetchTopLeagues(),
        fetchCurrentLeague(),
        fetchLeaguePlayers()
      ]);
      setTopLeagues(topLeaguesData);
      setCurrentLeague(currentLeagueData);
      setLeaguePlayers(leaguePlayersData);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const navigateToProfile = (username: string) => {
    router.push({
      pathname: "/user-profile",
      params: { username }
    });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'players' ? 'leagues' : 'players');
  };

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
            color={scheme === 'dark' ? '#FFF' : '#000'} 
          />
          <Text style={styles.headerButtonText}>{viewMode === 'players' ? 'Leagues' : 'Players'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {viewMode === 'leagues' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Leagues</Text>
              {Array.isArray(topLeagues) && topLeagues.length > 0 ? (
                topLeagues.map((league, index) => (
                  <View key={league.id} style={styles.row}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <View style={styles.leagueInfo}>
                      <Text style={styles.leagueName}>{league.name}</Text>
                      {league.topPlayer ? (
                        <Text style={styles.leagueTopPlayer}>
                          Top Player: {league.topPlayer.username} ({league.topPlayer.points} pts)
                        </Text>
                      ) : (
                        <Text style={styles.leagueTopPlayer}>No top player data</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No leagues available</Text>
              )}
            </View>
            {currentLeague && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Current League</Text>
                <View style={styles.row}>
                  <View style={styles.leagueInfo}>
                    <Text style={styles.leagueName}>{currentLeague.name}</Text>
                    {currentLeague.topPlayer ? (
                      <Text style={styles.leagueTopPlayer}>
                        Top Player: {currentLeague.topPlayer.username} ({currentLeague.topPlayer.points} pts)
                      </Text>
                    ) : (
                      <Text style={styles.leagueTopPlayer}>No top player data</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Players in Your League</Text>
              {Array.isArray(leaguePlayers) && leaguePlayers.length > 0 ? (
                leaguePlayers.map((player, index) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[styles.row, player.isCurrentUser && styles.currentUserRow]}
                    onPress={() => navigateToProfile(player.username)}
                  >
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                    <Image 
                      source={DEFAULT_IMAGE}
                      style={styles.profilePic}
                    />
                    <Text style={[styles.username, player.isCurrentUser && styles.currentUserText]}>
                      {player.username} {player.isCurrentUser && '(You)'}
                    </Text>
                    <Text style={styles.points}>{player.points} pts</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noDataText}>No players available</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Players</Text>
            {Array.isArray(leaguePlayers) && leaguePlayers.length > 0 ? (
              leaguePlayers.map((player, index) => (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.row, player.isCurrentUser && styles.currentUserRow]}
                  onPress={() => navigateToProfile(player.username)}
                >
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                  <Image 
                    source={DEFAULT_IMAGE}
                    style={styles.profilePic}
                  />
                  <Text style={[styles.username, player.isCurrentUser && styles.currentUserText]}>
                    {player.username} {player.isCurrentUser && '(You)'}
                  </Text>
                  <Text style={styles.points}>{player.points} pts</Text>
                </TouchableOpacity>
              ))
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
});

export default LeagueRankingPage;
