import { Landmine, LandmineLib } from "../types/types";
import { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Image, Button, Modal, ScrollView } from "react-native";


export type LandminePlacementPopupProps = {
  visible: boolean;
  onClose: () => void;
};

// Function to add a landmine to the map
export function addLandmine(latitude: number, longitude: number) {
  throw new Error("Function not implemented.");
}

const fetchLandmineLib = (): Promise<LandmineLib[]> => {
  return new Promise((resolve) => {
    // Simulating asynchronous data fetching
    setTimeout(() => {
      const LandmineLibraryData: LandmineLib[] = [
        { type: 'Amplifier', quantity: 10, description: " Landmine" },
        { type: 'Ballista', quantity: 9 , description: " Landmine "},
        { type: 'BigBertha', quantity: 8 , description: " Landmine "},
        { type: 'Bombabom', quantity: 7 , description: " Landmine "},
        { type: 'BunkerBlocker', quantity: 6 , description: " Landmine "},
        { type: 'Buzzard', quantity: 5 , description: " Landmine "},
        { type: 'ClusterBomb', quantity: 4 , description: " Landmine "},
        { type: 'CorporateRaider', quantity: 3 , description: " Landmine "},
        { type: 'GutShot', quantity: 2 , description: " Landmine "},
        { type: 'TheNuke', quantity: 1 , description: " Landmine "},
        { type: 'Yokozuna', quantity: 5 , description: " Landmine "},
        { type: 'Zippy', quantity: 3 , description: " Landmine "},
      ];
      resolve(LandmineLibraryData);
    }, 0); // Simulating a delay of 1 second
  });
};
interface LandmineImages {
  [key: string]: any;
}
// For Landmine Images for both markers and library
export const LandmineImages: LandmineImages = {
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

  // Add other Landmine images here
};

export const LandmineLibrary = ({ playerName }: { playerName: string }) => {
  const [LandmineLibrary, setLandmineLibrary] = useState<LandmineLib[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLandmine, setSelectedLandmine] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchLandmineLibrary = async () => {
      try {
        const LandmineLibraryData = await fetchLandmineLib();
        setLandmineLibrary(LandmineLibraryData);
      } catch (error) {
        console.error('Error fetching Landmine library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLandmineLibrary();
  }, []);

  const handleLandmineClick = (LandmineType: string) => {
    setSelectedLandmine(LandmineType);
    setShowPopup(true);
  };

  const handleFire = () => {
    // Implement fire logic here
    console.log("Firing Landmine:", selectedLandmine, "at player:", playerName);
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
      <Text>Select your LandMine:</Text>
      {LandmineLibrary.map((Landmine, index) => (
        <TouchableOpacity key={index} onPress={() => handleLandmineClick(Landmine.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <Image source={LandmineImages[Landmine.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
          <Text>{Landmine.type} - Quantity: {Landmine.quantity}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
