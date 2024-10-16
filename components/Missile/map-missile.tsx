import React, { useEffect, useState } from "react";
import { View, Image, Platform, ScrollView, Text, useColorScheme, Modal, TouchableOpacity, Dimensions } from "react-native";
import { Circle, Marker, Polyline } from "react-native-maps";
import { GeoLocation, Missile } from "middle-earth";
import { convertimestampfuturemissile } from "../../util/get-time-difference";
import { getWeaponTypes, Product } from "../../api/store";
import { getImages } from "../../api/store";
import { getShopStyles } from "../../map-themes/stylesheet";

interface AllMissilesProps {
    missileData: Missile[];
}

interface TrajectCalc {
    latitude: number, longitude: number

}

interface MissileProps {
    destination: GeoLocation;
    currentLocation: GeoLocation;
    trajectoryCoordinates: TrajectCalc[];
    sentbyusername: string;
    radius: number;
    type: string;
    status: string;
    etatimetoimpact: string
}

export const AllMissiles = (props: AllMissilesProps) => {

    return (
        <>
            {props.missileData.map(({ destination, currentLocation, radius, type, status, etatimetoimpact, sentbyusername }, index) => {

                // Define a mapping of image paths with an index signature (paths found in components)

                // Calculate coordinates for trajectory line
                const trajectoryCoordinates = [
                    { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                    { latitude: destination.latitude, longitude: destination.longitude },
                ];

                return (
                    <React.Fragment key={index}>
                        <MapMissile destination={destination}
                            currentLocation={currentLocation}
                            trajectoryCoordinates={trajectoryCoordinates}
                            sentbyusername={sentbyusername}
                            radius={radius}
                            type={type}
                            status={status}
                            etatimetoimpact={etatimetoimpact} />
                    </React.Fragment>
                );
            })}
        </>
    );
}

export const MapMissile = (missileProps: MissileProps) => {

    const [weapons, setWeapons] = useState<Product[]>([]);
    const [selectedMissile, setSelectedMissile] = useState<MissileProps | null>(null);
    const [missileDetails, setMissileDetails] = useState<Product | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

    useEffect(() => {
        const loadImages = async () => {
            const imageGetter = await getImages();
            setGetImageForProduct(() => imageGetter);
        };
        loadImages();
    }, []);

    useEffect(() => {
        const fetchWeapons = async () => {
          try {
            const response = await getWeaponTypes();
            const { missileTypes } = response;
    
            const mappedMissiles = missileTypes.map((missile: any) => ({
              id: missile.name,
              name: missile.name,
              type: 'Missiles',
              price: missile.price,
              image: getImageForProduct(missile.name),
              description: missile.description,
              speed: missile.speed,
              radius: missile.radius,
              damage: missile.damage,
              fallout: missile.fallout,
            }));
    
            setWeapons([...mappedMissiles]);
          } catch (error) {
            console.error('Error fetching weapons:', error);
          }
        };
    
        fetchWeapons();
      }, []);

    const geolib = require('geolib');

    const generateTrajectory = (start: any, end: any, segments: number) => {
        const totalDistance = geolib.getDistance(start, end);
        const bearing = geolib.getGreatCircleBearing(start, end);
        let points = [start]; // Start with the initial position

        for (let i = 1; i < segments; i++) {
            const distanceTraveled = (totalDistance / segments) * i;
            const intermediatePoint = geolib.computeDestinationPoint(start, distanceTraveled, bearing);
            points.push({ latitude: intermediatePoint.latitude, longitude: intermediatePoint.longitude });
        }

        points.push(end);
        return points;
    };

    const trajectoryCoordinates = generateTrajectory(missileProps.currentLocation, missileProps.destination, 100);

    // Ensure all coordinates are numbers
    const validTrajectoryCoordinates = trajectoryCoordinates.map(coord => ({
        latitude: Number(coord.latitude),
        longitude: Number(coord.longitude)
    }));

    const resizedmissileimage = getImageForProduct(missileProps.type);
    const standardMissileSize = { width: 50, height: 50 }; // Fixed size for all missile images

    // Convert timestamp to a future time in a readable format

    // Determine the description based on the missile status
    let description = `${missileProps.status}`;
    if (missileProps.status === `Incoming. Sent by: ${missileProps.sentbyusername}`) {
        const { text } = convertimestampfuturemissile(missileProps.etatimetoimpact);
        description += ` ETA: ${text}`;
    }

    const isAndroid = Platform.OS === 'android';

    const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const styles = getShopStyles(isDarkMode ? 'dark' : 'light');

    const handleMarkerPress = () => {
        setSelectedMissile(missileProps);
        const missileProduct = weapons.find(weapon => weapon.name === missileProps.type) || null;
        setMissileDetails(missileProduct);
        setModalVisible(true);
    };

    const renderMissileDetails = () => {
        if (!selectedMissile || !missileDetails) return null;

        const fallbackImage = require('../../assets/logo.png');

        return (
            <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
                <ScrollView>
                    <View style={styles.modalHeader}>
                        <Image 
                            source={getImageForProduct(selectedMissile.type) || fallbackImage} 
                            style={styles.modalImage}
                            defaultSource={fallbackImage}
                        />
                        <View style={styles.modalTitleContainer}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
                                {selectedMissile.type || 'Unknown Missile'}
                            </Text>
                            <Text style={[styles.modalPrice, isDarkMode && styles.modalPriceDark]}>
                                🪙{missileDetails.price || 'N/A'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalDescription, isDarkMode && styles.modalDescriptionDark]}>
                            {missileDetails.description || 'No description available'}
                        </Text>
                        <View style={styles.modalStatsContainer}>
                            <Text style={[styles.modalTextProminent, isDarkMode && styles.modalTextProminentDark]}>
                                Status: {selectedMissile.status || 'Unknown'}
                            </Text>
                            <Text style={[styles.modalTextProminent, isDarkMode && styles.modalTextProminentDark]}>
                                Sent by: {selectedMissile.sentbyusername || 'Unknown'}
                            </Text>
                            <Text style={[styles.modalTextProminent, isDarkMode && styles.modalTextProminentDark]}>
                                ETA: {selectedMissile.etatimetoimpact ? convertimestampfuturemissile(selectedMissile.etatimetoimpact).text : 'Unknown'}
                            </Text>

                            <View style={styles.lessImportantDetails}>
                                <Text style={[styles.modalTextSecondary, isDarkMode && styles.modalTextSecondaryDark]}>
                                    Speed: {missileDetails.speed || 'N/A'} m/s
                                </Text>
                                <Text style={[styles.modalTextSecondary, isDarkMode && styles.modalTextSecondaryDark]}>
                                    Radius: {selectedMissile.radius || 'N/A'} m
                                </Text>
                                <Text style={[styles.modalTextSecondary, isDarkMode && styles.modalTextSecondaryDark]}>
                                    Fallout: {missileDetails.fallout || 'N/A'} mins
                                </Text>
                                <Text style={[styles.modalTextSecondary, isDarkMode && styles.modalTextSecondaryDark]}>
                                    Damage: {missileDetails.damage || 'N/A'} per 30 seconds
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
                <TouchableOpacity
                    style={[styles.button, styles.buttonClose]}
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.textStyle}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View>
            {/* Render Circle at destination coords */}
            <Circle
                center={{
                    latitude: Number(missileProps.destination.latitude),
                    longitude: Number(missileProps.destination.longitude)
                }}
                radius={missileProps.radius}
                fillColor="rgba(255, 0, 0, 0.2)"
                strokeColor="rgba(255, 0, 0, 0.8)"
                // Add these props for Android
                {...(isAndroid && {
                    strokeWidth: 1,
                    zIndex: 1,
                })}
            />
            {/* Render Marker at current coords */}
            <Marker
                coordinate={{
                    latitude: Number(missileProps.currentLocation.latitude),
                    longitude: Number(missileProps.currentLocation.longitude)
                }}
                title={`Missile: ${missileProps.type}`}
                description={description}
                onPress={handleMarkerPress}
            >
                <Image 
                    source={resizedmissileimage} 
                    style={standardMissileSize} 
                    resizeMode="contain"
                />
            </Marker>
            {/* Render trajectory line */}
            <Polyline
                coordinates={validTrajectoryCoordinates}
                strokeColor="red"
                strokeWidth={3}
            />
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    {renderMissileDetails()}
                </View>
            </Modal>
        </View>
    )
}

// Add these styles to your existing styles object
const additionalStyles = {
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: Dimensions.get('window').width * 0.9,
        maxHeight: Dimensions.get('window').height * 0.8,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalContainerDark: {
        backgroundColor: '#333',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginTop: 15,
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
};
