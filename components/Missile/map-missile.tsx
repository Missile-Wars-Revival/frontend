import React, { useEffect, useState } from "react";
import { View, Platform, ScrollView, Text, useColorScheme, Modal, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Circle, Marker, Polyline } from "react-native-maps";
import { GeoLocation, Missile } from "middle-earth";
import { convertimestampfuturemissile } from "../../util/get-time-difference";
import { getWeaponTypes, Product, getImages } from "../../api/store";
import { getPalette, Radius, Spacing, Type, cardShadow } from "../ui/theme";
import * as geolib from 'geolib';

const fallbackImage = require('../../assets/logo.png');

interface AllMissilesProps {
    missileData: Missile[];
}

interface MissileProps {
    destination: GeoLocation;
    currentLocation: GeoLocation;
    sentbyusername: string;
    radius: number;
    type: string;
    status: string;
    etatimetoimpact: string;
    weapons: Product[];
    getImageForProduct: (imageName: string) => any;
}

export const AllMissiles = (props: AllMissilesProps) => {
    const [weapons, setWeapons] = useState<Product[]>([]);
    const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => fallbackImage);

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
    }, [getImageForProduct]);

    return (
        <>
            {props.missileData.map(({ destination, currentLocation, radius, type, status, etatimetoimpact, sentbyusername }, index) => (
                <React.Fragment key={index}>
                    <MapMissile destination={destination}
                        currentLocation={currentLocation}
                        sentbyusername={sentbyusername}
                        radius={radius}
                        type={type}
                        status={status}
                        etatimetoimpact={etatimetoimpact}
                        weapons={weapons}
                        getImageForProduct={getImageForProduct} />
                </React.Fragment>
            ))}
        </>
    );
}

export const MapMissile = (missileProps: MissileProps) => {

    const { weapons, getImageForProduct } = missileProps;
    const [modalVisible, setModalVisible] = useState(false);

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

    const isAndroid = Platform.OS === 'android';

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const c = getPalette(isDarkMode);

    const missileDetails = weapons.find(weapon => weapon.name === missileProps.type) || null;

    const handleMarkerPress = () => {
        setModalVisible(true);
    };

    const isIncoming = missileProps.status?.startsWith('Incoming');
    const eta = missileProps.etatimetoimpact
        ? convertimestampfuturemissile(missileProps.etatimetoimpact).text
        : 'Unknown';

    const renderStatRow = (label: string, value: string, prominent = false) => (
        <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
            <Text
                style={[
                    prominent ? styles.statValueProminent : styles.statValue,
                    { color: prominent ? c.text : c.textMuted },
                ]}
            >
                {value}
            </Text>
        </View>
    );

    const renderMissileDetails = () => (
        <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalCard, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}
        >
            <ScrollView bounces={false}>
                <View style={styles.modalHeader}>
                    <View style={[styles.modalImageWell, { backgroundColor: c.surfaceAlt }]}>
                        <Image
                            source={resizedmissileimage || fallbackImage}
                            style={styles.modalImage}
                            contentFit="contain"
                        />
                    </View>
                    <View style={styles.modalTitleContainer}>
                        <Text style={[styles.modalTitle, { color: c.text }]}>
                            {missileProps.type || 'Unknown Missile'}
                        </Text>
                        <Text style={[styles.modalPrice, { color: c.gold }]}>
                            🪙{missileDetails?.price ?? 'N/A'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.statusChip, { backgroundColor: isIncoming ? c.dangerSoft : c.warningSoft }]}>
                    <Text style={[styles.statusChipText, { color: isIncoming ? c.danger : c.warning }]}>
                        {missileProps.status || 'Unknown'}
                    </Text>
                </View>

                {missileDetails?.description ? (
                    <Text style={[styles.modalDescription, { color: c.textMuted }]}>
                        {missileDetails.description}
                    </Text>
                ) : null}

                <View style={[styles.statsContainer, { backgroundColor: c.surfaceAlt }]}>
                    {renderStatRow('Sent by', missileProps.sentbyusername || 'Unknown', true)}
                    {renderStatRow('ETA', eta, true)}
                    {renderStatRow('Speed', `${missileDetails?.speed ?? 'N/A'} m/s`)}
                    {renderStatRow('Radius', `${missileProps.radius || 'N/A'} m`)}
                    {renderStatRow('Fallout', `${missileDetails?.fallout ?? 'N/A'} mins`)}
                    {renderStatRow('Damage', `${missileDetails?.damage ?? 'N/A'} per 30s`)}
                </View>
            </ScrollView>
            <Pressable
                style={[styles.closeButton, { backgroundColor: c.accent }]}
                onPress={() => setModalVisible(false)}
            >
                <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
        </Pressable>
    );

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
                onPress={handleMarkerPress}
                zIndex={1}
            >
                <Image
                    source={resizedmissileimage}
                    style={standardMissileSize}
                    contentFit="contain"
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
                statusBarTranslucent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={[styles.modalOverlay, { backgroundColor: c.overlay }]}
                    onPress={() => setModalVisible(false)}
                >
                    {renderMissileDetails()}
                </Pressable>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderRadius: Radius.xl,
        padding: Spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        marginBottom: Spacing.md,
    },
    modalImageWell: {
        width: 72,
        height: 72,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: 56,
        height: 56,
    },
    modalTitleContainer: {
        flex: 1,
    },
    modalTitle: {
        ...Type.title,
    },
    modalPrice: {
        ...Type.headline,
        marginTop: Spacing.xs,
    },
    statusChip: {
        alignSelf: 'flex-start',
        borderRadius: Radius.pill,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        marginBottom: Spacing.md,
    },
    statusChipText: {
        ...Type.caption,
    },
    modalDescription: {
        ...Type.body,
        marginBottom: Spacing.md,
    },
    statsContainer: {
        borderRadius: Radius.md,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: Spacing.md,
    },
    statLabel: {
        ...Type.caption,
    },
    statValue: {
        ...Type.body,
        flexShrink: 1,
        textAlign: 'right',
    },
    statValueProminent: {
        ...Type.headline,
        fontSize: 14,
        flexShrink: 1,
        textAlign: 'right',
    },
    closeButton: {
        marginTop: Spacing.lg,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    closeButtonText: {
        ...Type.button,
        color: '#fff',
    },
});
