import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, SafeAreaView } from 'react-native';
import { useOnboarding } from '../util/Context/onboardingContext';

const { width, height } = Dimensions.get('window');

const OnboardingOverlay: React.FC = () => {
    const { currentStep } = useOnboarding();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [bounceAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [currentStep]);

    const updateArrowPosition = () => {
        switch (currentStep) {
            case 'store':
                return { x: width * 0.31, y: height * 0.82 }; // Point to the store title
            case 'filter_missiles':
                return { x: width * 0.3, y: height * 0.24 }; // Point to the Missiles filter
            case 'buy_missile':
                return { x: width * 0.16, y: height * 0.43 }; // Point to the first missile
            case 'filter_landmines':
                return { x: width * 0.6, y: height * 0.24 }; // Point to the Landmines filter
            case 'buy_landmine':
                return { x: width * 0.16, y: height * 0.43 }; // Point to the first landmine
            case 'go_to_cart':
                return { x: width * 0.5, y: height * 0.75 }; // Point to the cart button
            case 'checkout':
                return { x: width * 0.5, y: height * 0.68 }; // Point to the checkout button
            case 'fire':
                return { x: width * 0.11, y: height * 0.72 }; // open th action popup
            case 'fire_landmine':
                return { x: width * 0.28, y: height * 0.3 }; // select landmine
            case 'choosefire_landmine':
                return { x: width * 0.68, y: height * 0.34 }; // choose a lanmdine
            case 'selectlandmine_location':
                return { x: width * 0.68, y: height * 0.34 }; // choose a location
            case 'place_landmine':
                return { x: width * 0.75, y: height * 0.75 }; // palce the landmine
            case 'playermenu':
                return { x: width * 0.885, y: height * 0.1 }; // open player menu
            case "fireplayermenu":
                return { x: width * 0.8, y: height * 0.176 }; // fire missile in player menu
            case 'choosemissile_fireplayermenu':
                return { x: width * 0.85, y: height * 0.01 }; // choose missile in player menu
            case 'confirmmissile_fireplayermenu':
                return { x: width * 0.25, y: height * 0.18 }; // confirm missile in player menu
            case 'friends':
                return { x: width * 0.7, y: height * 0.8 }; // add friends
            default:
                return { x: 0, y: 0 };
        }
    };

    const getStepContent = () => {
        switch (currentStep) {
            case 'store':
                return "Welcome to the Missile Wars! Lets head to the store. Here you can buy weapons and items.";
            case 'filter_missiles':
                return "Let's start by looking at missiles. Tap the 'Missiles' filter.";
            case 'buy_missile':
                return "Great! Now let's buy a missile. Tap on the first missile to add it to your cart.";
            case 'filter_landmines':
                return "Now let's check out landmines. Tap the 'Landmines' filter.";
            case 'buy_landmine':
                return "Good! Now add a landmine to your cart by tapping on the first landmine.";
            case 'go_to_cart':
                return "You've added items to your cart. Let's check out! Tap the 'Go to Cart' button.";
            case 'checkout':
                return "Review your items and tap 'Checkout All Items' to complete your purchase.";
            case 'fire':
                return "Great job! Now let's go back to the map and use the fire entity menu to use your items.";
            case 'fire_landmine':
                return "Select Landmine to place the landmine you bought on the map";
            case 'choosefire_landmine':
                return "Choose the landmine you purchased to place it on the map";
            case 'selectlandmine_location':
                return "Select a location to place the landmine";
            case 'place_landmine':
                return "Now Place!";
            case 'playermenu':
                return "Open this menu to show online players!";
            case 'fireplayermenu':
                return "Press Engage to fire a missile at the selected player";
            case 'choosemissile_fireplayermenu':
                return "Choose your missile to fire at the selected player";
            case 'confirmmissile_fireplayermenu':
                return "Press Confirm to fire your missile";
            case 'friends':
                return "Go to the Friends menu and use Quick Add to find nearby players.";
            default:
                return "";
        }
    };

    const arrowPosition = updateArrowPosition();

    const bounceInterpolation = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });

    const getTextPosition = (arrowPosition: { x: number; y: number }) => {
        const padding = 20;
        const textWidth = 200;
        const textHeight = 100; // Approximate height, adjust as needed

        let left = arrowPosition.x - textWidth / 2;
        let top = arrowPosition.y - textHeight - 50; // Position above the arrow by default

        // Ensure left edge is on screen
        left = Math.max(padding, left);
        // Ensure right edge is on screen
        left = Math.min(width - textWidth - padding, left);

        // If too close to top, position to the left of the arrow instead
        if (top < padding) {
            top = Math.max(padding, arrowPosition.y - textHeight / 2);
            left = Math.max(padding, arrowPosition.x - textWidth - 50);
        }

        // Ensure bottom edge is on screen
        top = Math.min(height - textHeight - padding, top);

        return { left, top };
    };

    return (
        <SafeAreaView style={styles.container} pointerEvents="box-none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="none">
                <View style={[styles.textContainer, getTextPosition(arrowPosition)]}>
                    <Text style={styles.text}>{getStepContent()}</Text>
                </View>
                <Animated.View
                    style={[
                        styles.arrowContainer,
                        {
                            left: arrowPosition.x - 20,
                            top: arrowPosition.y,
                            transform: [
                                { translateY: bounceInterpolation },
                            ],
                        },
                    ]}
                >
                    <View style={styles.arrowShaft} />
                    <View style={styles.arrowHead} />
                </Animated.View>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    textContainer: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 15,
        borderRadius: 10,
        maxWidth: 200,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    arrowContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    arrowShaft: {
        width: 8,
        height: 30,
        backgroundColor: 'red',
    },
    arrowHead: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 20,
        borderRightWidth: 20,
        borderTopWidth: 25,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'red',
    },
});

export default OnboardingOverlay;
