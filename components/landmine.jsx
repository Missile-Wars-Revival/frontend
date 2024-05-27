import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { LandminePlacementPopup } from './landmineplacement'; 

const fetchLandmineLib = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const LandmineLibraryData = [
        { type: 'Amplifier', quantity: 10, description: "Landmine" },
        { type: 'Ballista', quantity: 9, description: "Landmine" },
        { type: 'BigBertha', quantity: 8, description: "Landmine" },
        // Add other landmines as needed
      ];
      resolve(LandmineLibraryData);
    }, 1000); // Simulating a delay for asynchronous fetch
  });
};

const LandmineImages = {
  Amplifier: require('../assets/missiles/Amplifier.png'),
  Ballista: require('../assets/missiles/Ballista.png'),
  BigBertha: require('../assets/missiles/BigBertha.png'),
  // ... other landmine images
};

export const LandmineLibraryView = ({ LandmineModalVisible, landminePlaceHandler }) => {
  const [landmineLibrary, setLandmineLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLandmine, setSelectedLandmine] = useState(null);

  useEffect(() => {
    fetchLandmineLib().then(data => {
      setLandmineLibrary(data);
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching Landmine library:', error);
    });
  }, []);

  const handleLandmineClick = (landmineType) => {
    setSelectedLandmine(landmineType);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  if (loading) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={LandmineModalVisible}
      onRequestClose={landminePlaceHandler}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text>Select your Landmine:</Text>
            {landmineLibrary.map((landmine, index) => (
              <TouchableOpacity key={index} onPress={() => handleLandmineClick(landmine.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <Image source={LandmineImages[landmine.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
                <Text>{landmine.type} - Quantity: {landmine.quantity}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ alignSelf: 'flex-end', padding: 10 }}>
            <Button title="Cancel" onPress={landminePlaceHandler} />
          </View>
        </View>
      </View>
      {showPopup && <LandminePlacementPopup visible={showPopup} onClose={handleClosePopup} />}
    </Modal>
  );
};