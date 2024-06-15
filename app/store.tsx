import React, { useEffect, useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
  category: string;
}

const products: Product[] = [
  { id: 1, name: 'Amplifier', price: 3.99, image: require('../assets/missiles/Amplifier.png'), description: 'High impact missile', sku: "Amplifier", category: 'Missiles' },
  { id: 2, name: 'Ballista', price: 3.99, image: require('../assets/missiles/Ballista.png'), description: 'Long-range missile', sku: "Ballista", category: 'Missiles' },
  { id: 4, name: 'Big Bertha', price: 3.00, image: require('../assets/missiles/BigBertha.png'), description: 'Large warhead missile', sku: "BigBertha", category: 'Landmines' },
  { id: 5, name: 'Bombabom', price: 3.00, image: require('../assets/missiles/Bombabom.png'), description: 'Cluster bomb missile', sku: "Bombabom", category: 'Landmines' },
  { id: 6, name: 'Buzzard', price: 3.00, image: require('../assets/missiles/Buzzard.png'), description: 'Medium-range missile', sku: "Buzzard", category: 'Loot Drops' },
  { id: 7, name: 'The Nuke', price: 10.00, image: require('../assets/missiles/TheNuke.png'), description: 'Nuclear missile', sku: "The Nuke", category: 'Loot Drops' },
];

const StorePage: React.FC = () => {
  const userNAME = useUserName(); //logged in user
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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
        AsyncStorage.setItem('cartitems', JSON.stringify(newCart));
        return newCart;
      } else {
        const newCart = [...prevCart, { product, quantity: 1 }];
        AsyncStorage.setItem('cartitems', JSON.stringify(newCart));
        return newCart;
      }
    });
  };

  const handleRemove = (productId: number) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    AsyncStorage.setItem('cartitems', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

  return (
    <View style={styles.container}>
      {isCartVisible ? (
        <Cart cart={cart} onRemove={handleRemove} />
      ) : (
        <>
        <Text></Text>
        <Text></Text>
        <Text></Text>
          <View style={styles.categoryContainer}>
            {['All', 'Missiles', 'Landmines', 'Loot Drops'].map((category) => (
              <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={styles.categoryButton}>
                <Text>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredProducts}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ProductItem product={item} addToCart={addToCart} />}
            contentContainerStyle={styles.list}
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
  list: {
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  categoryButton: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  }
});

export default StorePage;
