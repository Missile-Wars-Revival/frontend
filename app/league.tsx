import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PlayerList from '../components/Leagues/playerlist';
import LeagueSelection from '../components/Leagues/leagueselection';

const LeagueRankingPage = () => {
  const currentRank = "Gold League"; // Example: Replace with actual logic to get current rank

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{currentRank}</Text>
      </View>
      <PlayerList />
      <LeagueSelection />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 35,
  },
});

export default LeagueRankingPage;
