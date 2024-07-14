import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface TimerProps {
    duration: number; // Duration of the timer in seconds
    onExpire: () => void; // Function to call when timer expires
  }
  

  const CountdownTimer: React.FC<TimerProps> = ({ duration, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const animatedWidth = useRef(new Animated.Value(width)).current; // Start with full width
    const colorAnimation = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          const nextTime = timeLeft - 1;
          if (nextTime < 0) {
            clearInterval(interval);
            onExpire();
            return 0;
          }
          colorAnimation.setValue((duration - nextTime) / duration); // Update color based on time left
          return nextTime;
        });
      }, 1000);
  
      return () => clearInterval(interval);
    }, []);
  
    useEffect(() => {
      Animated.timing(animatedWidth, {
        toValue: (timeLeft / duration) * width, // Calculate width as a fraction of time left
        duration: 1000,
        useNativeDriver: false
      }).start();
    }, [timeLeft]);
  
    const backgroundColor = colorAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['green', 'red']
    });
  
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.timerBar, { width: animatedWidth, backgroundColor }]}>
          <Text style={styles.timerText}>{`Run!! ${timeLeft}s`}</Text>
        </Animated.View>
      </View>
    );
  };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: height * 0.7,
    left: width * 0.05,
    width: width * 0.9, // Timer is now 90% of the screen width
    height: height * 0.05, // Reduced height for a thinner bar
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  timerBar: {
    position: 'absolute',
    height: '100%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: 'black',
    fontSize: 14, // Larger text for better readability
    fontWeight: 'bold',
  },
});

export default CountdownTimer;
