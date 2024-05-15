import React, { useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text } from 'react-native';
import ProductItem from '../components/Store/productitem';
import Cart from '../components/Store/cart';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string; // Added image field
}

const products: Product[] = [
  { id: 1, name: 'Product 1', price: 29.99, image: require('../assets/missiles/Amplifier.png') },
  { id: 2, name: 'Product 2', price: 19.99, image: require('../assets/missiles/Ballista.png') },
  { id: 3, name: 'Product 3', price: 39.99, image: require('../assets/missiles/BigBertha.png') },
];

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);

  const addToCart = (product: Product) => {
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

  const handleRemove = (productId: number) => {
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
