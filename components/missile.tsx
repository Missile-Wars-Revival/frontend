import { useEffect, useState } from "react";
import { Missilelib } from "../types/types";
import { Text, View, TouchableOpacity, Image, Button, Modal, ScrollView } from "react-native";
import React from "react";

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

//Missile Library:
const fetchMissileLib = (): Promise<Missilelib[]> => {
  return new Promise((resolve) => {
    // Simulating asynchronous data fetching
    setTimeout(() => {
      const missileLibraryData: Missilelib[] = [
        { type: 'Amplifier', quantity: 10, description: " Missile" },
        { type: 'Ballista', quantity: 9 , description: " Missile "},
        { type: 'BigBertha', quantity: 8 , description: " Missile "},
        { type: 'Bombabom', quantity: 7 , description: " Missile "},
        { type: 'BunkerBlocker', quantity: 6 , description: " Missile "},
        { type: 'Buzzard', quantity: 5 , description: " Missile "},
        { type: 'ClusterBomb', quantity: 4 , description: " Missile "},
        { type: 'CorporateRaider', quantity: 3 , description: " Missile "},
        { type: 'GutShot', quantity: 2 , description: " Missile "},
        { type: 'TheNuke', quantity: 1 , description: " Missile "},
        { type: 'Yokozuna', quantity: 5 , description: " Missile "},
        { type: 'Zippy', quantity: 3 , description: " Missile "},
      ];
      resolve(missileLibraryData);
    }, 0); // Simulating a delay of 1 second
  });
};
interface MissileImages {
  [key: string]: any;
}
// For Missile Images for both markers and library
export const missileImages: MissileImages = {
  Amplifier: require('../assets/missiles/Amplifier.png'),
  Ballista: require('../assets/missiles/Ballista.png'),
  BigBertha: require('../assets/missiles/BigBertha.png'),
  Bombabom: require('../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../assets/missiles/BunkerBlocker.png'),
  Buzzard: require('../assets/missiles/Buzzard.png'),
  ClusterBomb: require('../assets/missiles/ClusterBomb.png'),
  CorporateRaider: require('../assets/missiles/CorporateRaider.png'),
  GutShot: require('../assets/missiles/GutShot.png'),
  TheNuke: require('../assets/missiles/TheNuke.png'),
  Yokozuna: require('../assets/missiles/Yokozuna.png'),
  Zippy: require('../assets/missiles/Zippy.png'),

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
    // edit to also send current coords and that players coords (for curr and dest coords) 
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



//For when fire button is used without selected player
export const MissilefireposLibrary = () => {
  const [missileLibrary, setMissileLibrary] = useState<Missilelib[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showposPopup, setShowposPopup] = useState(false);

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
    //Shows confirm fire page 
    setShowposPopup(true);
  };

  const handleFire = () => {
    // Implement fire logic here. So add mapview 
    // submission to backend with, missile dest coords, current player coords 
    console.log("Selected missile:", selectedMissile);
    setShowposPopup(false);
  };

  const handleCancel = () => {
    setShowposPopup(false);
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
      <Modal visible={showposPopup} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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