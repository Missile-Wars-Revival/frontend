import React, { useEffect, useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Cart from '../components/Store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mainstorestyles, storepagestyles } from '../components/Store/storestylesheets';
import axiosInstance from '../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import axios from 'axios';

export interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  image: any;
  description: string;
  sku?: string;
}

const products: Product[] = [
  { id: "1", name: 'Amplifier', price: 100, image: require('../assets/missiles/Amplifier.png'), description: 'High impact missile', sku: "Amplifier", type: 'Missiles' },
  { id: "2", name: 'Ballista', price: 250, image: require('../assets/missiles/Ballista.png'), description: 'Long-range missile', sku: "Ballista", type: 'Missiles' },
  { id: "3", name: 'BigBertha', price: 500, image: require('../assets/missiles/BigBertha.png'), description: 'Large warhead missile', sku: "Big Bertha", type: 'Landmines' },
  { id: "4", name: 'Bombabom', price: 400, image: require('../assets/missiles/Bombabom.png'), description: 'Cluster bomb missile', sku: "Bombabom", type: 'Landmines' },
  { id: "5", name: 'Buzzard', price: 3000, image: require('../assets/missiles/Buzzard.png'), description: 'Medium-range missile', sku: "Buzzard", type: 'Missiles' },
  { id: "6", name: 'TheNuke', price: 10000, image: require('../assets/missiles/TheNuke.png'), description: 'Nuclear missile', sku: "The Nuke", type: 'Missiles' },
  { id: "7", name: 'LootDrop', price: 400, image: require('../assets/mapassets/Airdropicon.png'), description: 'A Loot Drop', sku: "Loot Drop", type: 'Loot Drops' },
];

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(0);
  const [isPremiumStore, setIsPremiumStore] = useState<boolean>(false);

  useEffect(() => {
    const loadCart = async () => {
      const storedCart = await AsyncStorage.getItem('cartitems');
      if (storedCart) setCart(JSON.parse(storedCart));
    };

    loadCart();
    
  }, []);
  useEffect(() => {
    const fetchCurrencyAmount = async () => {
      const token = await SecureStore.getItemAsync("token");
      try {
        if (!token) {
          console.log('Token not found');
          return; 
        }
  
        const response = await axiosInstance.get('/api/getMoney', {
          params: { token } 
        });
        setCurrencyAmount(response.data.money);
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.message);
        } else {
          console.error('Error fetching currency amount:', error);
        }
      }
    };
  
    fetchCurrencyAmount();
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

  const handleRemove = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    AsyncStorage.setItem('cartitems', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.type === selectedCategory);

  const renderButton = ({ item }: { item: Product }) => (
    <TouchableOpacity style={mainstorestyles.button} onPress={() => addToCart(item)}>
      <Text style={mainstorestyles.buttonText}>{item.name}</Text>
      <Image source={item.image} style={mainstorestyles.buttonImage} />
      <Text style={mainstorestyles.buttonText}>🪙{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={require('../assets/mapbackdrop.png')} style={mainstorestyles.backgroundImage}>
      <Image source={require('../assets/MissleWarsTitle.png')} style={mainstorestyles.titleImage} />
      <Image source={require('../assets/SHOP.png')} style={mainstorestyles.shopImage} />
      <View style={mainstorestyles.headerContainer}>
        <View style={mainstorestyles.currencyContainer}>
          <Text style={mainstorestyles.currencyText} numberOfLines={1} ellipsizeMode="tail">
            🪙{currencyAmount}
          </Text>
        </View>
        <View style={mainstorestyles.switchContainer}>
          <TouchableOpacity
            style={[
              mainstorestyles.toggleButton,
              isPremiumStore ? mainstorestyles.coinsButton : mainstorestyles.premiumButton,
            ]}
            onPress={() => setIsPremiumStore(!isPremiumStore)} // Add logic to switch out the free store items for the premium items when clicked.
          >
            <Text style={mainstorestyles.toggleButtonText}>
              {isPremiumStore ? 'Premium' : 'Coins'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
  
      <View style={mainstorestyles.tabContainerMissiles}>
        {['All', 'Missiles', 'Landmines', 'Loot Drops'].map((category) => (
          <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={mainstorestyles.tabMissiles}>
            <Text style={mainstorestyles.missileTabText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={mainstorestyles.container}>
        {isCartVisible ? (
          <Cart cart={cart} onRemove={handleRemove} />
        ) : (
          <>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderButton}
              numColumns={2}
              columnWrapperStyle={mainstorestyles.columnWrapper}
              contentContainerStyle={mainstorestyles.contentContainer}
            />
            <TouchableOpacity onPress={() => setCartVisible(true)} style={mainstorestyles.cartButton}>
              <Text style={mainstorestyles.cartButtonText}>Go to Cart</Text>
            </TouchableOpacity>
          </>
        )}
        {isCartVisible && (
          <TouchableOpacity onPress={() => setCartVisible(false)} style={mainstorestyles.cartButton}>
            <Text style={mainstorestyles.cartButtonText}>Back to Products</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );  
}  

export default StorePage;