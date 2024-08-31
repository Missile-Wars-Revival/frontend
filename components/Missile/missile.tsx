import { useEffect, useState } from "react";
import { Missilelib } from "../../types/types";
import { Text, View, TouchableOpacity, Image, Button, Modal, ScrollView } from "react-native";
import React from "react";
import { MissilePlacementPopup } from './missileplacement';
import { firemissileplayer } from "../../api/fireentities";
import useFetchInventory from "../../hooks/websockets/inventoryhook";

//ws fetch inventory
const inventoryItems = useFetchInventory();

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
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    // Filter inventory items to get missiles
    const missileLibraryData = inventoryItems
      .filter(item => item.category === "Missiles" && item.quantity > 0)
      .map(item => ({
        type: item.name,
        quantity: item.quantity
      }));

    setMissileLibrary(missileLibraryData);
    setNoItems(missileLibraryData.length === 0);
    setLoading(false);
  }, [inventoryItems]);

  const handleMissileClick = (missileType: string) => {
    setSelectedMissile(missileType);
    setShowPopup(true);
  };

  const handleFire = () => {
    // Implement fire logic here
    console.log("Firing missile:", selectedMissile, "at player:", playerName);
    if (selectedMissile) {
      firemissileplayer(playerName, selectedMissile)
    }
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
      {noItems ? (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>No Missiles Available</Text>
          <Text style={{ textAlign: 'center' }}>You don't have any missiles in your inventory. Visit the store to purchase some!</Text>
        </View>
      ) : (
      missileLibrary.map((missile, index) => (
        <TouchableOpacity key={index} onPress={() => handleMissileClick(missile.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <Image source={missileImages[missile.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
          <Text>{missile.type} - Quantity: {missile.quantity}</Text>
        </TouchableOpacity>
      ))
    )}
      <Modal visible={showPopup} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Target: {playerName}</Text>
          <Text>Missile Type: {selectedMissile}</Text>
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
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    // Filter inventory items to get missiles
    const missileLibraryData = inventoryItems
      .filter(item => item.category === "Missiles" && item.quantity > 0)
      .map(item => ({
        type: item.name,
        quantity: item.quantity
      }));

    setMissileLibrary(missileLibraryData);
    setNoItems(missileLibraryData.length === 0);
    setLoading(false);
  }, [inventoryItems]);

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
      {noItems ? (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>No Missiles Available</Text>
          <Text style={{ textAlign: 'center' }}>You don't have any missiles in your inventory. Visit the store to purchase some!</Text>
        </View>
      ) : (
        <>
          <Text>Select your Missile:</Text>
          {missileLibrary.map((missile, index) => (
            <TouchableOpacity key={index} onPress={() => handleMissileClick(missile.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
              <Image source={missileImages[missile.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
              <Text>{missile.type} - Quantity: {missile.quantity}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showplacmentPopup}>
        {showplacmentPopup && <MissilePlacementPopup visible={showplacmentPopup} onClose={handleCancel} selectedMissile={selectedMissile} />}
      </Modal>
    </ScrollView>
  );
};