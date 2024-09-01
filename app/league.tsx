import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import PlayerList from '../components/Leagues/playerlist';
import LeagueSelection from '../components/Leagues/leagueselection';

const LeagueRankingPage = () => {
  const currentRank = "Gold League"; // Example: Replace with actual logic to get current rank

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{currentRank}</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your League</Text>
          <PlayerList />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Leagues</Text>
          <LeagueSelection />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4a90e2',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3a7bc8',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});

export default LeagueRankingPage;
