import React, { useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text } from 'react-native';
import ProductItem from '../components/Store/productitem';
import Cart from '../components/Store/cart';

interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: 'Product 1', price: 29.99 },
  { id: 2, name: 'Product 2', price: 19.99 },
  { id: 3, name: 'Product 3', price: 39.99 },
];

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  return (
    <View style={styles.container}>
      {isCartVisible ? (
        <Cart cart={cart} />
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
