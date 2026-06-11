import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, useColorScheme } from 'react-native';
import { getPalette, Radius, Type, cardShadow } from './ui/theme';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface HealthBarProps {
  health: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  const [animatedHealth] = useState(() => new Animated.Value(0));
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);

  useEffect(() => {
    Animated.timing(animatedHealth, {
      toValue: health,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [health, animatedHealth]);

  const healthBarHeight = animatedHealth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const healthColor = animatedHealth.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [c.danger, c.warning, c.success]
  });

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }, cardShadow(isDarkMode)]}>
      <View style={styles.levelLines}>
        {Array.from({ length: 11 }, (_, index) => (
          <View key={index} style={[styles.levelLine, { top: `${index * 10}%` }]}>
            <Text style={[styles.levelText, { color: c.textMuted }]}>{100 - index * 10}</Text>
            <View style={[styles.line, { borderBottomColor: c.border }]} />
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
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
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
    fontSize: 10,
    textAlign: 'right',
    marginRight: 5,
  },
  line: {
    flex: 1,
    borderBottomWidth: 1,
  },
  healthBar: {
    position: 'absolute',
    width: '100%',
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthText: {
    ...Type.micro,
    fontSize: 9,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
});

export default HealthBar;
