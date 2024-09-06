import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, useColorScheme } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface HealthBarProps {
  health: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  const animatedHealth = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    Animated.timing(animatedHealth, {
      toValue: health,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [health]);

  const healthBarHeight = animatedHealth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const healthColor = animatedHealth.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['#FF4136', '#FFDC00', '#2ECC40']
  });

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.levelLines}>
        {Array.from({ length: 11 }, (_, index) => (
          <View key={index} style={[styles.levelLine, { top: `${index * 10}%` }]}>
            <Text style={[styles.levelText, isDarkMode && styles.levelTextDark]}>{100 - index * 10}</Text>
            <View style={[styles.line, isDarkMode && styles.lineDark]} />
          </View>
        ))}
      </View>
      <Animated.View 
        style={[
          styles.healthBar, 
          { 
            height: healthBarHeight, 
            backgroundColor: healthColor,
            bottom: 0 
          }
        ]}
      >
        <Text style={styles.healthText}>Health</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: width * 0.002,
    width: 40,
    height: height * 0.35,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerDark: {
    backgroundColor: '#2C2C2C',
  },
  levelLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  levelLine: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    width: 30,
    color: '#4a5568',
    fontSize: 10,
    textAlign: 'right',
    marginRight: 5,
  },
  levelTextDark: {
    color: '#B0B0B0',
  },
  line: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E0',
  },
  lineDark: {
    borderBottomColor: '#4A5568',
  },
  healthBar: {
    position: 'absolute',
    width: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
});

export default HealthBar;
