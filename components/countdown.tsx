import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, useColorScheme } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface TimerProps {
    duration: number; // Duration of the timer in seconds
    onExpire: () => void; // Function to call when timer expires
    style?: object; // Add this line to allow custom styling
}

const CountdownTimer: React.FC<TimerProps> = ({ duration, onExpire, style }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const animatedWidth = useRef(new Animated.Value(width * 0.9)).current; // Start with full width
    const colorAnimation = useRef(new Animated.Value(0)).current;
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const colorScheme = useColorScheme();

    const updateTimer = useCallback(() => {
        setTimeLeft((prevTime) => {
            const nextTime = prevTime - 1;
            if (nextTime < 0) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                onExpire();
                return 0;
            }
            colorAnimation.setValue((duration - nextTime) / duration);
            return nextTime;
        });
    }, [duration, onExpire, colorAnimation]);

    useEffect(() => {
        intervalRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [updateTimer]);

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: (timeLeft / duration) * width, // Calculate width as a fraction of time left
            duration: 1000,
            useNativeDriver: false
        }).start();
    }, [timeLeft, duration, animatedWidth]);

    const backgroundColor = colorAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: colorScheme === 'dark' 
            ? ['#4CAF50', '#FFA000', '#F44336']  // Dark mode colors
            : ['#8BC34A', '#FFB300', '#FF5252']  // Light mode colors
    });

    const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

    return (
        <View style={[styles.container, style]}>
            <Animated.View style={[styles.timerBar, { width: animatedWidth, backgroundColor }]}>
                <Text style={[styles.timerText, { color: textColor }]}>{`${timeLeft}s`}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width * 0.9,
        height: height * 0.04,
        backgroundColor: 'transparent',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#00000020',
    },
    timerBar: {
        position: 'absolute',
        height: '100%',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 10,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CountdownTimer;
