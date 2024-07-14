import { useEffect, useState } from "react";
import { Missilelib } from "../../types/types";
import { Text, View, TouchableOpacity, Image, Button, Modal, ScrollView } from "react-native";
import React from "react";
import { MissilePlacementPopup } from './missileplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../../api/axios-instance";

//Missile types
//   Amplifier:
//   Ballista: 
//   BigBertha:
//   Bombabom: 
//   BunkerBlocker:
//   Buzzard: 
//   ClusterBomb: 
//   CorporateRaider: 
//   GutShot: 
//   TheNuke: 
//   Yokozuna: 
//   Zippy: 

//Missile Library needs to be fetched by backend:


const fetchMissileLib = async (): Promise<Missilelib[]> => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("No authentication token found.");
    }

    const response = await axiosInstance.get('/api/getInventory', {
      params: { token }
    });

    const inventory = response.data;

    // Filter the inventory to include only items with the category "Missiles"
    const missileLibraryData = inventory
      .filter((item: { category: string; }) => item.category === "Missiles")
      .map((item: { name: any; quantity: any; }) => ({
        type: item.name,
        quantity: item.quantity
      }));

    return missileLibraryData;
  } catch (error) {
    console.error('Failed to fetch missile library', error);
    throw error;
  }
};

interface MissileImages {
  [key: string]: any;
}
// For Missile Images for both markers and library
export const missileImages: MissileImages = {
  Amplifier: require('../../assets/missiles/Amplifier.png'),
  Ballista: require('../../assets/missiles/Ballista.png'),
  BigBertha: require('../../assets/missiles/BigBertha.png'),
  Bombabom: require('../../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../../assets/missiles/BunkerBlocker.png'),
  Buzzard: require('../../assets/missiles/Buzzard.png'),
  ClusterBomb: require('../../assets/missiles/ClusterBomb.png'),
  CorporateRaider: require('../../assets/missiles/CorporateRaider.png'),
  GutShot: require('../../assets/missiles/GutShot.png'),
  TheNuke: require('../../assets/missiles/TheNuke.png'),
  Yokozuna: require('../../assets/missiles/Yokozuna.png'),
  Zippy: require('../../assets/missiles/Zippy.png'),

  // Add other missile images here
};

export const MissileLibrary = ({ playerName }: { playerName: string }) => {
  const [missileLibrary, setMissileLibrary] = useState<Missilelib[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchMissileLibrary = async () => {
      try {
        const missileLibraryData = await fetchMissileLib();
        setMissileLibrary(missileLibraryData);
      } catch (error) {
        console.error('Error fetching missile library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissileLibrary();
  }, []);

  const handleMissileClick = (missileType: string) => {
    setSelectedMissile(missileType);
    setShowPopup(true);
  };

  const handleFire = () => {
    // Implement fire logic here
    console.log("Firing missile:", selectedMissile, "at player:", playerName);
    setShowPopup(false);
  };

  const handleCancel = () => {
    setShowPopup(false);
  };

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>Select your Missile:</Text>
      {missileLibrary.map((missile, index) => (
        <TouchableOpacity key={index} onPress={() => handleMissileClick(missile.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <Image source={missileImages[missile.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
          <Text>{missile.type} - Quantity: {missile.quantity}</Text>
        </TouchableOpacity>
      ))}
      <Modal visible={showPopup} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Target: {playerName}</Text>
          <Text>Missile Type: {selectedMissile}</Text>
          {/* Add player name input */}
          <Image source={missileImages[selectedMissile || ""]} style={{ width: 100, height: 100, marginVertical: 10 }} />
          <Button title="Fire" onPress={handleFire} color="red" />
          <Button title="Cancel" onPress={handleCancel} />
        </View>
      </Modal>
    </ScrollView>
  );
};

//For when fire button is used without player
//This is what should be used when using fire-selector button
export const MissilefireposLibrary = () => {
  const [missileLibrary, setMissileLibrary] = useState<Missilelib[]>([]);
  const [loading, setLoading] = useState(true);
  const [showplacmentPopup, setShowplacementPopup] = useState(false);
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissileLibrary = async () => {
      try {
        const missileLibraryData = await fetchMissileLib();
        setMissileLibrary(missileLibraryData);
      } catch (error) {
        console.error('Error fetching missile library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissileLibrary();
  }, []);

  const handleMissileClick = (selectedMissile: string) => {
    setSelectedMissile(selectedMissile);
    //shows map page
    setShowplacementPopup(true);
  };

  const handleCancel = () => {
    setShowplacementPopup(false);
    //setShowposPopup(false);
  };

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>Select your Missile:</Text>
      {missileLibrary.map((missile, index) => (
        <TouchableOpacity key={index} onPress={() => handleMissileClick(missile.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <Image source={missileImages[missile.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
          <Text>{missile.type} - Quantity: {missile.quantity}</Text>
        </TouchableOpacity>
      ))}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showplacmentPopup}>
        {showplacmentPopup && <MissilePlacementPopup visible={showplacmentPopup} onClose={handleCancel} selectedMissile={selectedMissile} />}
      </Modal>

    </ScrollView>
  );
};