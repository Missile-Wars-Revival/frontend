import React from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface HealthBarProps {
  health: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health }) => {
  const healthBarHeight = `${health}%`;

  return (
    <View style={styles.container}>
      <View style={styles.levelLines}>
        {Array.from({ length: 11 }, (_, index) => (
          <View key={index} style={[styles.levelLine, { top: `${index * 10}%` }]}>
            <Text style={styles.levelText}>{100 - index * 10}</Text>
            <View style={styles.line} />
          </View>
        ))}
      </View>
      <View style={[styles.healthBar, { height: healthBarHeight, bottom: 0 } as ViewStyle]}>
        <Text style={styles.healthText}>Health</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: height * 0.06, 
    left: width * 0.01, 
    width: width * 0.1, 
    height: height * 0.30, 
    backgroundColor: '#ddd',
    borderRadius: 10,
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
    color: 'black',
    fontSize: height * 0.015,
    textAlign: 'right',
    marginRight: 5,
  },
  line: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  healthBar: {
    position: 'absolute',
    width: '100%',
    backgroundColor: 'red',
    borderRadius: 10,
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  healthText: {
    color: 'white',
    fontSize: height * 0.01,
    fontWeight: 'bold',
  },
});

export default HealthBar;
