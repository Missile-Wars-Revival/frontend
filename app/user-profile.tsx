import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getuserprofile } from '../api/getprofile';
import { fetchAndCacheImage } from '../util/imagecache';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

export interface Statistics {
  badges: string[];
  numDeaths: number;
  numLootPlaced: number;
  numLandminesPlaced: number;
  numMissilesPlaced: number;
  numLootPickups: number;
}

interface UserProfile {
  username: string;
  rankpoints: number;
  mutualFriends: string[];
  statistics: Statistics;
}

interface ApiResponse {
  success: boolean;
  userProfile: UserProfile;
}

const UserProfilePage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [friendImages, setFriendImages] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      loadProfileImage();
    }
  }, [username]);

  useEffect(() => {
    if (userProfile && userProfile.mutualFriends) {
      loadFriendImages();
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
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
  };

  const loadProfileImage = async () => {
    if (username) {
      const imageUrl = await fetchAndCacheImage(username);
      setUserImageUrl(imageUrl);
    }
  };

  const loadFriendImages = async () => {
    if (userProfile && userProfile.mutualFriends) {
      const images: { [key: string]: string } = {};
      for (const friend of userProfile.mutualFriends) {
        images[friend] = await fetchAndCacheImage(friend);
      }
      setFriendImages(images);
    }
  };

  if (!username) {
    return <Text>No username provided</Text>;
  }

  if (!userProfile) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>{userProfile.username}'s Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: userImageUrl || Image.resolveAssetSource(DEFAULT_IMAGE).uri }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{userProfile.username}</Text>
          <View style={styles.rankPointsContainer}>
            <Text style={styles.rankPoints}>🏅 {userProfile.rankpoints} Rank Points</Text>
          </View>
          <View style={styles.badgesContainer}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesList}>
              {userProfile.statistics.badges && userProfile.statistics.badges.length > 0 ? (
                userProfile.statistics.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}><Text>{badge}</Text></View>
                ))
              ) : (
                <Text>No badges yet</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statisticsContainer}>
              <Text style={styles.statItem}>Deaths: {userProfile.statistics.numDeaths}</Text>
              <Text style={styles.statItem}>Missiles Fired: {userProfile.statistics.numMissilesPlaced}</Text>
              <Text style={styles.statItem}>Landmines Placed: {userProfile.statistics.numLandminesPlaced}</Text>
              <Text style={styles.statItem}>Loot Placed: {userProfile.statistics.numLootPlaced}</Text>
              <Text style={styles.statItem}>Loot Pickups: {userProfile.statistics.numLootPickups}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mutual Friends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slider}>
            {userProfile.mutualFriends && userProfile.mutualFriends.length > 0 ? (
              userProfile.mutualFriends.map((friend, index) => (
                <TouchableOpacity key={index} style={styles.sliderItem}>
                  <Image 
                    source={{ uri: friendImages[friend] || Image.resolveAssetSource(DEFAULT_IMAGE).uri }} 
                    style={styles.friendImage} 
                  />
                  <Text style={styles.friendName}>{friend}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No mutual friends</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
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
    backgroundColor: '#edf2f7',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  rankPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
  },
});

export default UserProfilePage;
