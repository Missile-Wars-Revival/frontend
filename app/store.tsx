import React, { useEffect, useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text } from 'react-native';
import ProductItem from '../components/Store/productitem';
import Cart from '../components/Store/cart';
import { useUserName } from '../util/fetchusernameglobal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  sku: string;
}

const products: Product[] = [
  { id: 1, name: 'Amplifier', price: 9.99, image: require('../assets/missiles/Amplifier.png'), description: 'Missile', sku: "Amplifier" },
  { id: 2, name: 'Ballista', price: 8.99, image: require('../assets/missiles/Ballista.png'), description: 'Missile', sku: "Ballista" },
  { id: 3, name: 'Big Bertha', price: 10.00, image: require('../assets/missiles/BigBertha.png'), description: 'Missile', sku: "BigBertha" },
];

const StorePage: React.FC = () => {
  const userNAME = useUserName(); //logged in user

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);

  useEffect(() => {
    const loadCart = async () => {
      const storedCart = await AsyncStorage.getItem('cartitems');
      if (storedCart) setCart(JSON.parse(storedCart));
    };

    loadCart();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const cartItem = prevCart.find((item) => item.product.id === product.id);
      if (cartItem) {
        const newCart = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
        AsyncStorage.setItem('cartitems', JSON.stringify(newCart)); // Persist updated cart
        return newCart;
      } else {
        const newCart = [...prevCart, { product, quantity: 1 }];
        AsyncStorage.setItem('cartitems', JSON.stringify(newCart)); // Persist updated cart
        return newCart;
      }
    });
  };

  const handleRemove = (productId: number) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    AsyncStorage.setItem('cartitems', JSON.stringify(updatedCart)); // Persist updated cart
    setCart(updatedCart);
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
