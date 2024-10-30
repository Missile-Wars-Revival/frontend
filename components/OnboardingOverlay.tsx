import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, SafeAreaView, Platform, Image } from 'react-native';
import { useOnboarding } from '../util/Context/onboardingContext';

const { width, height } = Dimensions.get('window');

const OnboardingOverlay: React.FC = () => {
    const { currentStep } = useOnboarding();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [bounceAnim] = useState(new Animated.Value(0));

    // Add responsive sizing helpers
    const isTablet = width >= 768; // Common tablet breakpoint
    const scale = Math.min(width / 375, height / 812); // Base scale from iPhone X dimensions

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
        // Use more reliable positioning based on percentages and safe areas
        const safeTop = Platform.OS === 'ios' ? 44 : 0;
        const safeBottom = Platform.OS === 'ios' ? 34 : 0;
        
        const safeHeight = height - safeTop - safeBottom;
        
        switch (currentStep) {
            case 'store':
                return {
                    x: width * (isTablet ? 0.25 : 0.31),
                    y: safeHeight * 0.82 + safeTop
                };
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
                return { x: width * 0.55, y: height * 0.4 }; // choose a location
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
                return {
                    message: "Hey recruit! I'm Commander Sarah, and I'll be your guide. Let's gear up at the store - we've got some seriously cool weapons waiting for you! 🚀",
                    emotion: 'excited'
                };
            case 'filter_missiles':
                return {
                    message: "These babies pack quite a punch! Tap the 'Missiles' filter and let's check out our arsenal. Trust me, you're gonna love this part! 💥",
                    emotion: 'confident'
                };
            case 'buy_missile':
                return {
                    message: "Perfect! Select the first missile to add it to your cart.",
                    emotion: 'neutral'
                };
            case 'filter_landmines':
                return {
                    message: "Next, let's look at our landmines. Tap the 'Landmines' filter.",
                    emotion: 'neutral'
                };
            case 'buy_landmine':
                return {
                    message: "Excellent! Select the first landmine to add it to your cart.",
                    emotion: 'neutral'
                };
            case 'go_to_cart':
                return {
                    message: "Your items are ready! Tap 'Go to Cart' to proceed to checkout.",
                    emotion: 'excited'
                };
            case 'checkout':
                return {
                    message: "Review your selected items and tap 'Checkout All Items' to complete your purchase.",
                    emotion: 'neutral'
                };
            case 'fire':
                return {
                    message: "Excellent! Return to the map and open the fire menu to use your new items.",
                    emotion: 'confident'
                };
            case 'fire_landmine':
                return {
                    message: "Select 'Landmine' to deploy your newly purchased landmine on the map.",
                    emotion: 'neutral'
                };
            case 'choosefire_landmine':
                return {
                    message: "Select which landmine you'd like to deploy.",
                    emotion: 'neutral'
                };
            case 'selectlandmine_location':
                return {
                    message: "Choose where you'd like to place your landmine on the map.",
                    emotion: 'neutral'
                };
            case 'place_landmine':
                return {
                    message: "Tap to deploy your landmine!",
                    emotion: 'excited'
                };
            case 'playermenu':
                return {
                    message: "Open this menu to view all online players.",
                    emotion: 'neutral'
                };
            case 'fireplayermenu':
                return {
                    message: "Select 'Engage' to launch a missile at your target.",
                    emotion: 'confident'
                };
            case 'choosemissile_fireplayermenu':
                return {
                    message: "Select which missile you'd like to launch at your target.",
                    emotion: 'confident'
                };
            case 'confirmmissile_fireplayermenu':
                return {
                    message: "Tap 'Confirm' to launch your missile!",
                    emotion: 'neutral'
                };
            case 'friends':
                return {
                    message: "Time to build your squad! Head to the Friends menu and use Quick Add to connect with nearby operatives. Remember, the best strategies come from teamwork! 🤝",
                    emotion: 'friendly'
                };
            default:
                return { message: "", emotion: 'neutral' };
        }
    };

    const arrowPosition = updateArrowPosition();

    const bounceInterpolation = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });

    const getTextPosition = (arrowPosition: { x: number; y: number }) => {
        const padding = 10;
        const textWidth = 380;  // Updated to accommodate avatar inside the container
        const textHeight = 110; // Approximate height including avatar, adjust as needed

        let left = arrowPosition.x - textWidth / 2;
        let top = arrowPosition.y - textHeight - 50;

        // Ensure left edge is on screen
        left = Math.max(padding, left);
        left = Math.min(width - textWidth - padding, left);

        // Ensure top edge is on screen
        const safeTopBoundary = height * 0.12; // Adjust to ensure text doesn't go too high
        top = Math.max(safeTopBoundary, top);
        // Ensure bottom edge is on screen
        top = Math.min(height - textHeight - padding, top);

        return {
            left,
            top,
        };
    };

    const textPosition = getTextPosition(arrowPosition);

    return (
        <SafeAreaView style={styles.container} pointerEvents="box-none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="none">
                <View style={[styles.messageContainer, { left: textPosition.left, top: textPosition.top }]}>
                    <Image
                        source={require('../assets/mapassets/marinefemale.png')}
                        style={styles.avatar}
                    />
                    <View style={styles.speechBubble}>
                        <Text style={[styles.text, { fontSize: scale * 16 }]}>
                            {getStepContent().message}
                        </Text>
                    </View>
                </View>
                <Animated.View
                    style={[
                        styles.arrowContainer,
                        {
                            left: arrowPosition.x - 20,
                            top: arrowPosition.y,
                            transform: [{ translateY: bounceInterpolation }],
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
        borderRadius: 10,
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
    messageContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: width * 0.8,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    speechBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 15,
        marginLeft: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderBottomLeftRadius: 5,
    },
});

export default OnboardingOverlay;
