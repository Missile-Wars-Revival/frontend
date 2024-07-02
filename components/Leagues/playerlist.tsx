import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ListItem, Text } from 'react-native-elements';

type Player = {
  id: number;
  name: string;
  points: number;
  rank?: number; // Optional rank
};

const playersData: Player[] = [
  { id: 1, name: 'Test User', points: 2000 },
  { id: 2, name: 'Other Test User', points: 2689 },
  // Add more player data
];

// Sort players by points in descending order
playersData.sort((a, b) => b.points - a.points);

// Assign ranks based on sorted order
playersData.forEach((player, index) => {
  player.rank = index + 1; // Assign rank starting from 1
});

const PlayerList: React.FC = () => {
  const renderItem = ({ item }: { item: Player }) => (
    <ListItem containerStyle={styles.listItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <ListItem.Content>
        <ListItem.Title style={styles.playerName}>{item.name}</ListItem.Title>
        <ListItem.Subtitle style={styles.pointsText}>{`Points: ${item.points}`}</ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={playersData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Background color
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  listItem: {
    backgroundColor: '#ffffff', // Item background color
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  rankContainer: {
    backgroundColor: '#ffc107', // Rank background color (similar to Clash of Clans)
    borderRadius: 50,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // Rank text color
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsText: {
    fontSize: 14,
    color: '#808080', // Points text color
  },
});

export default PlayerList;
