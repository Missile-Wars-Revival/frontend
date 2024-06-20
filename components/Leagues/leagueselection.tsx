import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native'; // Assuming navigation is used from @react-navigation/native

type League = {
  id: number;
  name: string;
  trophyPoints: string;
};

const leaguesData: League[] = [
  { id: 1, name: 'Bronze League', trophyPoints: "0-1000" },
  { id: 2, name: 'Silver League', trophyPoints: "1000-2000" },
  { id: 3, name: 'Gold League', trophyPoints: "2000-4000" },
  // Add more league data as needed
];

const LeagueSelectionScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation(); // Adjust as per your navigation setup

  const renderLeagueItem = ({ item }: { item: League }) => (
    <ListItem containerStyle={styles.listItem} onPress={() => handleLeaguePress(item)}>
      <ListItem.Content>
        <ListItem.Title style={styles.leagueName}>{item.name}</ListItem.Title>
        <ListItem.Subtitle style={styles.trophyPoints}>{`${item.trophyPoints} Rank Points`}</ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );

  const handleLeaguePress = (league: League) => {
    setModalVisible(false);
    // navigation.navigate('OtherLeaguePlayers', { league });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Icon name="trophy" type="font-awesome" size={32} />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select League</Text>
            <FlatList
              data={leaguesData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderLeagueItem}
              contentContainerStyle={styles.flatListContainer}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    marginRight: 27,
    marginTop: 55,
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  flatListContainer: {
    flexGrow: 1,
  },
  listItem: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 15,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trophyPoints: {
    color: '#808080',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LeagueSelectionScreen;
