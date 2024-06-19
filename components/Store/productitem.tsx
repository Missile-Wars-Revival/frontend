import React, { useState, useEffect } from 'react';
import { Text, Button, Image, StyleSheet, Animated, PanResponder } from 'react-native';

interface Product {
  id: number;
  name: string;
  price: number;
  image: any; 
  description: string;
}

interface Props {
  product: Product;
  addToCart: (product: Product) => void;
}

const ProductItem: React.FC<Props> = ({ product, addToCart }) => {
  const [flip] = useState(new Animated.Value(0));

  useEffect(() => {
    const flipBackTimer = setTimeout(() => {
      flipCard(false);
    }, 30000);

    return () => clearTimeout(flipBackTimer);
  }, []);

  const flipCard = (flipForward: boolean) => {
    const toValue = flipForward ? 180 : 0;
    Animated.timing(flip, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (e, gestureState) => {
      if (gestureState.dx > 50) {
        flipCard(true); // Flip forward
      } else if (gestureState.dx < -50) {
        flipCard(false); // Flip back
      }
    },
  });

  const interpolatedFlip = flip.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: interpolatedFlip }],
  };

  return (
    <Animated.View style={[styles.itemContainer, frontAnimatedStyle]} {...panResponder.panHandlers}>
      <Text style={styles.name}>{product.name}</Text>
      <Image source={product.image} style={styles.image} />
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      <Button title="Add to Cart" onPress={() => addToCart(product)} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backfaceVisibility: 'hidden',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 300,
    marginVertical: 8,
    borderRadius: 4,
  },
  price: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
  },
});

export default ProductItem;
