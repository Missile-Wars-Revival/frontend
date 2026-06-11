import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, Pressable, Alert, useColorScheme, Platform, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { getuserprofile } from '../../../api/getprofile';
import useFetchFriends from '../../../hooks/websockets/friendshook';
import { Avatar } from '../../../components/ui/Avatar';
import { addFriend } from '../../../api/friends';

const badgeImages = {
  Founder: require('../../../assets/icons/founder.png'),
  Staff: require('../../../assets/icons/staff.png'),
  Early: require('../../../assets/icons/earlysupporter.png'),
  //leagues
  Bronze: require('../../../assets/leagues/bronze.png'),
  Silver: require('../../../assets/leagues/silver.png'),
  Gold: require('../../../assets/leagues/gold.png'),
  Diamond: require('../../../assets/leagues/diamond.png'),
  Legend: require('../../../assets/leagues/legend.png')
  // Add more badge images here
};

export interface Statistics {
  badges: string[];
  numDeaths: number;
  numKills: number;
  numLootPlaced: number;
  numLandminesPlaced: number;
  numMissilesPlaced: number;
  numLootPickups: number;
  league: string; 
}

interface MutualFriend {
  username: string;
  profileImageUrl: string | null;
}

interface UserProfile {
  username: string;
  rankpoints: number;
  profileImageUrl: string | null;
  mutualFriends: MutualFriend[];
  statistics: Statistics;
}

interface ApiResponse {
  success: boolean;
  userProfile: UserProfile;
}

const UserProfilePage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const friends = useFetchFriends();
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [addedAsFriend, setAddedAsFriend] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const isFriend = useMemo(
    () =>
      addedAsFriend ||
      Boolean(username && friends.some((friend) => friend.username === username)),
    [addedAsFriend, username, friends],
  );

  useEffect(() => {
    setAddedAsFriend(false);
  }, [username]);

  const fetchUserProfile = useCallback(async () => {
    if (!username) return;
    try {
      const response = await getuserprofile(username) as ApiResponse;
      if (response.success && response.userProfile) {
        setUserProfile(response.userProfile);
      } else {
        console.error('Failed to fetch user profile: Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to fetch user profile', error);
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;
    fetchUserProfile();
  }, [username, fetchUserProfile]);

  const handleAddFriend = async () => {
    const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found')
        return; 
      }
      if (!userProfile) {
        console.log('User profile not found');
        return;
      }
      const result = await addFriend(token, userProfile.username);
      // Assuming successful addition if no errors thrown and possibly checking a status or message
      if (result.message === "Friend added successfully") {
        setAddedAsFriend(true);
        Alert.alert("Success", "Friend added successfully!");
      } else {
        // Handle any other messages or default case
        Alert.alert("Error", result.message || "Failed to add friend.");
      }
    } catch (error) {
      // Handle any errors thrown from the addFriend function
      console.warn('Error adding friend:', error);
      Alert.alert("This player is already your friend!");
    }
  };

  const renderBadge = (badge: string) => {
    const badgeKey = Object.keys(badgeImages).find(key => badge.toLowerCase().includes(key.toLowerCase()));
    if (badgeKey) {
      return (
        <Pressable 
          key={badge} 
          style={styles.badge}
          onPress={() => setSelectedBadge(badge)}
        >
          <Image
            source={badgeImages[badgeKey as keyof typeof badgeImages]}
            style={styles.badgeImage}
            contentFit="contain"
          />
        </Pressable>
      );
    }
    return null;
  };

  if (!username) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
        <Text style={isDarkMode ? styles.textDark : styles.text}>No username provided</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
        <Text style={isDarkMode ? styles.textDark : styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backButton, isDarkMode && styles.backButtonDark]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>{userProfile.username}'s Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileContainer, isDarkMode && styles.profileContainerDark]}>
          <Avatar
            uri={userProfile.profileImageUrl}
            style={styles.profileImage}
          />
          <Text style={[styles.profileName, isDarkMode && styles.profileNameDark]}>{userProfile.username}</Text>
          {!isFriend && (
            <Pressable style={styles.addFriendButton} onPress={handleAddFriend}>
              <Text style={styles.addFriendButtonText}>Add Friend</Text>
            </Pressable>
          )}
          <View style={styles.rankPointsContainer}>
            <Text style={[styles.rankPoints, isDarkMode && styles.rankPointsDark]}>
              🏅 {userProfile.rankpoints} Rank Points
              {userProfile.statistics.league && (
                <Text style={[styles.leagueText, isDarkMode && styles.leagueTextDark]}> • {userProfile.statistics.league}</Text>
              )}
            </Text>
          </View>
          <View style={styles.badgesContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Badges</Text>
            <View style={styles.badgesList}>
              {userProfile.statistics.badges && userProfile.statistics.badges.length > 0 ? (
                userProfile.statistics.badges.map(renderBadge)
              ) : (
                <Text style={[styles.text, isDarkMode && styles.textDark]}>No badges yet</Text>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.sectionContainer, isDarkMode && styles.sectionContainerDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Statistics</Text>
          <View style={styles.statisticsContainer}>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Deaths: {userProfile.statistics.numDeaths}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Kills: {userProfile.statistics.numKills}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Missiles Fired: {userProfile.statistics.numMissilesPlaced}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Landmines Placed: {userProfile.statistics.numLandminesPlaced}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Loot Placed: {userProfile.statistics.numLootPlaced}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Loot Pickups: {userProfile.statistics.numLootPickups}</Text>
          </View>
        </View>

        <View style={[styles.sectionContainer, isDarkMode && styles.sectionContainerDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Mutual Friends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slider}>
            {userProfile.mutualFriends && userProfile.mutualFriends.length > 0 ? (
              userProfile.mutualFriends.map((friend, index) => (
                <Pressable key={index} style={styles.sliderItem}>
                  <Avatar
                    uri={friend.profileImageUrl}
                    style={styles.friendImage}
                  />
                  <Text style={[styles.friendName, isDarkMode && styles.friendNameDark]}>{friend.username}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={[styles.text, isDarkMode && styles.textDark]}>No mutual friends</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable onPress={() => setSelectedBadge(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>{selectedBadge}</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#4a5568',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#ffffff',
    fontSize: 18,
    marginRight: 15,
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 15,
  },
  badgesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  badgesList: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    overflow: 'hidden',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2d3748',
  },
  slider: {
    flexDirection: 'row',
  },
  sliderItem: {
    marginRight: 15,
    alignItems: 'center',
  },
  friendImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  friendName: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  statisticsContainer: {
    padding: 10,
  },
  statItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  rankPointsContainer: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  rankPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    textAlign: 'center',
  },
  leagueText: {
    fontSize: 16,
    color: '#718096',
  },
  addFriendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  addFriendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  text: {
    color: '#333',
  },

  // Dark mode styles
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
    paddingTop: 20,
  },
  backButtonDark: {
    color: '#FFF',
  },
  headerTextDark: {
    color: '#FFF',
  },
  profileContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  profileNameDark: {
    color: '#FFF',
  },
  sectionContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  sectionTitleDark: {
    color: '#FFF',
  },
  badgeDark: {
    backgroundColor: '#3D3D3D',
  },
  statItemDark: {
    color: '#FFF',
  },
  friendNameDark: {
    color: '#FFF',
  },
  rankPointsDark: {
    color: '#4CAF50',
  },
  leagueTextDark: {
    color: '#B0B0B0',
  },
  textDark: {
    color: '#B0B0B0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // Light mode background
  },
  loadingContainerDark: {
    backgroundColor: '#1E1E1E', // Dark mode background
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalText: {
    fontSize: 18,
    color: '#333',
  },
  modalTextDark: {
    color: '#FFF',
  },
});

export default UserProfilePage;
