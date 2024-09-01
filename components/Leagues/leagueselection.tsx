import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';

type League = {
  id: number;
  name: string;
  trophyPoints: string;
  icon: string;
};

const leaguesData: League[] = [
  { id: 1, name: 'Bronze League', trophyPoints: "0-1000", icon: 'https://example.com/bronze.png' },
  { id: 2, name: 'Silver League', trophyPoints: "1000-2000", icon: 'https://example.com/silver.png' },
  { id: 3, name: 'Gold League', trophyPoints: "2000-4000", icon: 'https://example.com/gold.png' },
  // Add more league data as needed
];

const LeagueSelection: React.FC = () => {
  const renderLeagueItem = ({ item }: { item: League }) => (
    <TouchableOpacity style={styles.leagueItem} onPress={() => handleLeaguePress(item)}>
      <Image source={{ uri: item.icon }} style={styles.leagueIcon} />
      <View style={styles.leagueInfo}>
        <Text style={styles.leagueName}>{item.name}</Text>
        <Text style={styles.trophyPoints}>{`${item.trophyPoints} Rank Points`}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleLeaguePress = (league: League) => {
    // Handle league selection (e.g., navigate to league details)
    console.log(`Selected league: ${league.name}`);
  };

  return (
    <FlatList
      data={leaguesData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderLeagueItem}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  leagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  leagueIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  trophyPoints: {
    fontSize: 14,
    color: '#4a90e2',
  },
});

export default LeagueSelection;
