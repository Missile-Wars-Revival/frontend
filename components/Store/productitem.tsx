import React, { useState, useEffect } from 'react';
import { Text, Button, Image, StyleSheet, Animated, PanResponder } from 'react-native';
import { Product } from '../../app/store';
import { GameItem } from 'middle-earth'
import { storepagestyles } from './storestylesheets';


interface Props {
  product: GameItem;
  addToCart: (product: GameItem) => void;
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
    <Animated.View style={[storepagestyles.itemContainer, frontAnimatedStyle]} {...panResponder.panHandlers}>
      <Text style={storepagestyles.name}>{product.name}</Text>
      <Image source={product.image} style={storepagestyles.image} />
      <Text style={storepagestyles.price}>{product.price.toFixed(2)} Coins</Text>
      <Button title="Add to Cart" onPress={() => addToCart(product)} />
    </Animated.View>
  );
};

export default ProductItem;
