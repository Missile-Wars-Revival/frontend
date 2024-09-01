import React from 'react';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { ListItem, Text } from 'react-native-elements';

type Player = {
  id: number;
  name: string;
  points: number;
  rank?: number;
  avatar?: string;
};

const playersData: Player[] = [
  { id: 1, name: 'Test User', points: 2000, avatar: 'https://example.com/avatar1.png' },
  { id: 2, name: 'Other Test User', points: 2689, avatar: 'https://example.com/avatar2.png' },
  // Add more player data
];

// Sort players by points in descending order and assign ranks
playersData.sort((a, b) => b.points - a.points)
           .forEach((player, index) => { player.rank = index + 1; });

const PlayerList: React.FC = () => {
  const renderItem = ({ item }: { item: Player }) => (
    <ListItem containerStyle={styles.listItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <ListItem.Content>
        <ListItem.Title style={styles.playerName}>{item.name}</ListItem.Title>
        <ListItem.Subtitle style={styles.pointsText}>{`${item.points} points`}</ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <FlatList
      data={playersData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  rankContainer: {
    backgroundColor: '#ffd700',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsText: {
    fontSize: 14,
    color: '#4a90e2',
  },
});

export default PlayerList;
