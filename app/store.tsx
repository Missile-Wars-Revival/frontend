import React, { useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text } from 'react-native';
import ProductItem from '../components/Store/productitem';
import Cart from '../components/Store/cart';
import { useUserName } from '../util/fetchusernameglobal';
import { GameItem } from 'middle-earth';

const products: GameItem[] = [
  { id: "1", name: 'Amplifier', cost: 9.99, image: require('../assets/missiles/Amplifier.png'), description: 'Missile' },
  { id: "2", name: 'Ballista', cost: 8.99, image: require('../assets/missiles/Ballista.png'), description: 'Missile' },
  { id: "3", name: 'Big Bertha', cost: 10.00, image: require('../assets/missiles/BigBertha.png'), description: 'Missile' },
];

const StorePage: React.FC = () => {
  const userNAME = useUserName(); //logged in user

  const [cart, setCart] = useState<{ product: GameItem; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);

  const addToCart = (product: GameItem) => {
    setCart((prevCart) => {
      const cartItem = prevCart.find((item) => item.product.id === product.id);
      if (cartItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const handleRemove = (productId: string) => {
    
    // Implement logic to remove the product from the cart
    // For example:
    setCart(cart.filter(item => item.product.id !== productId));
  };

  return (
    <View style={styles.container}>
      {isCartVisible ? (
        <Cart cart={cart} onRemove={handleRemove} />

      ) : (
        <>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ProductItem product={item} addToCart={addToCart} />}
          />
          <Button title="Go to Cart" onPress={() => setCartVisible(true)} />
        </>
      )}
      {isCartVisible && <Button title="Back to Products" onPress={() => setCartVisible(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
});

export default StorePage;
