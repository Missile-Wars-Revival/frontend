import React, { useState, useEffect } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, Keyboard, TouchableWithoutFeedback, SafeAreaView, useColorScheme, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { NearbyPlayersData, searchOtherPlayersData } from "../../../api/getplayerlocations";
import { addFriend } from "../../../api/friends";
import { router } from "expo-router";
import { getCurrentLocation, location } from "../../../util/locationreq";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from '@expo/vector-icons';
import { fetchAndCacheImage } from "../../../util/imagecache";
import FriendAddedAnimation from "../../../components/Animations/FriendAddedAnimation";

interface Filterddata {
  username: string,
  latitude: string,
  longitude: string,
  profileImageUrl: string | null;
}

const DEFAULT_IMAGE = require("../../../assets/mapassets/Female_Avatar_PNG.png");

const QuickAddPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredData, setFilteredData] = useState<Filterddata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    const fetchCredentials = async () => {
      const username = await SecureStore.getItemAsync("username");
      if (username) {
      } else {
        console.log('Credentials not found, please log in');
        // Optionally redirect to login page
        router.navigate("/login");
      }
    };

    fetchCredentials();
  }, []);

  const fetchLocation = async () => {
    const location: location = await getCurrentLocation();
    setUserLocation(location)
    }

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      setLoading(true);
      NearbyPlayersData(userLocation.latitude, userLocation.longitude)
        .then(data => {
          setPlayersData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch players:", error);
          setLoading(false);
        });
    }
  }, [userLocation]);

  const handleAddFriend = async (friendUsername: string) => {
    const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found')
        return; 
      }
      const result = await addFriend(token, friendUsername);
      if (result.message === "Friend added successfully") {
        setPlayersData(prevData => 
          prevData.map(player =>
            player.username === friendUsername ? { ...player, isFriend: "You are already friends with this person." } : player
          )
        );
        setShowAnimation(true); // Trigger the animation
      } else {
        Alert.alert("Error", result.message || "Failed to add friend.");
      }
    } catch (error) {
      console.warn('Error adding friend:', error);
      Alert.alert("This player is already your friend!");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      setLoading(true);
      NearbyPlayersData(userLocation.latitude, userLocation.longitude)
        .then(data => {
          setPlayersData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch players:", error);
          setLoading(false);
        });
    }
    setRefreshing(false);
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setFilteredData([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const currentUserUsername = await SecureStore.getItemAsync("username");
      
      if (currentUserUsername === null) {
        console.error("No username found in secure storage.");
        setFilteredData([]);
        setIsSearching(false);
        return;
      }

      const result = await searchOtherPlayersData(text);
      
      const filteredResult = result.filter(player => player.username !== currentUserUsername);
      
      const filteredResultWithImages = await Promise.all(
        filteredResult.map(async (player) => ({
          ...player,
          profileImageUrl: await fetchAndCacheImage(player.username),
        }))
      );
      
      setFilteredData(filteredResultWithImages);
    } catch (error) {
      console.error("Failed to search for players:", error);
      setFilteredData([]);
    }
  };

  const navigateToUserProfile = (username: string) => {
    router.navigate({
      pathname: "/user-profile",
      params: { username }
    });
  };

  const renderPlayerItem = ({ item }: { item: Filterddata }) => (
    <View style={[styles.playerItem, isDarkMode && styles.playerItemDark]}>
      <TouchableOpacity 
        style={styles.playerInfo}
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image
          source={item.profileImageUrl ? { uri: item.profileImageUrl } : DEFAULT_IMAGE}
          style={styles.playerImage}
          cachePolicy="memory-disk"
        />
        <Text style={[styles.playerName, isDarkMode && styles.playerNameDark]}>{item.username}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.addButton, isDarkMode && styles.addButtonDark]}
        onPress={() => handleAddFriend(item.username)}
      >
        <Ionicons name="add" size={24} color={isDarkMode ? "#4CAF50" : "white"} />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.navigate("/friends")}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "white"} />
          </TouchableOpacity>
          <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Add Friends</Text>
          <View style={styles.placeholder} />
        </View>
        
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
          placeholder="Search for friends..."
          placeholderTextColor={isDarkMode ? "#B0B0B0" : "#666"}
          autoCorrect={false}
          autoCapitalize="none"
          value={searchTerm}
          onChangeText={handleSearch}
        />
        
        {isSearching && (
          <View style={styles.searchResults}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Search Results:</Text>
            <FlatList
              data={filteredData}
              renderItem={renderPlayerItem}
              keyExtractor={item => item.username}
              ListEmptyComponent={
                <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>No players found</Text>
              }
            />
          </View>
        )}
        
        {!isSearching && (
          <>
            {loading ? (
              <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Loading...</Text>
            ) : playersData.length === 0 ? (
              <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                No players found near you
              </Text>
            ) : (
              <>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Players Nearby:</Text>
                <FlatList
                  data={playersData}
                  renderItem={renderPlayerItem}
                  keyExtractor={(item) => item.username}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[isDarkMode ? "#4CAF50" : "#4A5568"]}
                      tintColor={isDarkMode ? "#FFF" : "#000"}
                    />
                  }
                />
              </>
            )}
          </>
        )}
        
        {showAnimation && (
          <FriendAddedAnimation
            onAnimationComplete={() => {
              setShowAnimation(false);
              Alert.alert("Success", "Friend added successfully!");
            }}
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#4a5568',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerTextDark: {
    color: '#FFF',
  },
  backButton: {
    padding: 10,
  },
  backButtonDark: {
    backgroundColor: 'transparent', 
  },
  placeholder: {
    width: 44,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  searchInputDark: {
    backgroundColor: '#2C2C2C',
    color: '#FFF',
  },
  searchResults: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 1,
    marginLeft: 20,
    color: '#2d3748',
  },
  sectionTitleDark: {
    color: '#FFF',
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  playerItemDark: {
    backgroundColor: '#2C2C2C',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  playerNameDark: {
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
  },
  addButtonDark: {
    backgroundColor: '#3D3D3D',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#2d3748',
  },
  loadingTextDark: {
    color: '#B0B0B0',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#2d3748',
  },
  emptyTextDark: {
    color: '#B0B0B0',
  },
});

export default QuickAddPage;