import React, { useEffect, useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text, TouchableOpacity } from 'react-native';
import ProductItem from '../components/Store/productitem';
import Cart from '../components/Store/cart';
import { useUserName } from '../util/fetchusernameglobal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storepagestyles } from '../components/Store/storestylesheets';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: any;
  description: string;
  sku: string;
  category: string;
}

const products: Product[] = [
  { id: 1, name: 'Amplifier', price: 100, image: require('../assets/missiles/Amplifier.png'), description: 'High impact missile', sku: "Amplifier", category: 'Missiles' },
  { id: 2, name: 'Ballista', price: 250, image: require('../assets/missiles/Ballista.png'), description: 'Long-range missile', sku: "Ballista", category: 'Missiles' },
  { id: 4, name: 'Big Bertha', price: 500, image: require('../assets/missiles/BigBertha.png'), description: 'Large warhead missile', sku: "BigBertha", category: 'Landmines' },
  { id: 5, name: 'Bombabom', price: 400, image: require('../assets/missiles/Bombabom.png'), description: 'Cluster bomb missile', sku: "Bombabom", category: 'Landmines' },
  { id: 6, name: 'Buzzard', price: 3000, image: require('../assets/missiles/Buzzard.png'), description: 'Medium-range missile', sku: "Buzzard", category: 'Loot Drops' },
  { id: 7, name: 'The Nuke', price: 10000, image: require('../assets/missiles/TheNuke.png'), description: 'Nuclear missile', sku: "The Nuke", category: 'Loot Drops' },
];

const StorePage: React.FC = () => {
  const userNAME = useUserName(); //logged in user
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(500); // Initial currency amount of player for testing.

  useEffect(() => {
    const loadCart = async () => {
      const storedCart = await AsyncStorage.getItem('cartitems');
      if (storedCart) setCart(JSON.parse(storedCart));
    };

    loadCart();
  }, []);

  const addToCart = (product: Product) => {
    // Check if the user has enough currency to "purchase" the product
    if (currencyAmount >= product.price) {
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
      // Deduct the price from the currency amount
      setCurrencyAmount(prevAmount => prevAmount - product.price);
    } else {
      alert('Not enough currency!');
    }
  };

  const handleRemove = (productId: number) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    AsyncStorage.setItem('cartitems', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

  return (
    <View style={storepagestyles.container}>
      {isCartVisible ? (
        <Cart cart={cart} onRemove={handleRemove} />
      ) : (
        <>
        <Text></Text>
        <Text></Text>
        <Text></Text>
          <View style={storepagestyles.categoryContainer}>
            {['All', 'Missiles', 'Landmines', 'Loot Drops'].map((category) => (
              <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={storepagestyles.categoryButton}>
                <Text>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredProducts}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ProductItem product={item} addToCart={addToCart} />}
            contentContainerStyle={storepagestyles.list}
          />
          <Button title="Go to Cart" onPress={() => setCartVisible(true)} />
        </>
      )}
      {isCartVisible && <Button title="Back to Products" onPress={() => setCartVisible(false)} />}
      <Text style={storepagestyles.currencyText}>Coins left: {currencyAmount}</Text>
    </View>
  );
};
export default StorePage;