import React, { useEffect, useState } from 'react';
import { View, FlatList, Button, StyleSheet, Text, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Cart from '../components/Store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storepagestyles } from '../components/Store/storestylesheets';
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
  { id: "7", name: 'LootDrop', price: 400, image: require('../assets/mapassets/Airdropicon.png'), description: 'A Loot Drop', sku: "Loot Drop", type: 'Loot Drop' },
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
    <TouchableOpacity style={styles.button} onPress={() => addToCart(item)}>
      <Text style={styles.buttonText}>{item.name}</Text>
      <Image source={item.image} style={styles.buttonImage} />
      <Text style={styles.buttonText}>🪙{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={require('../assets/mapbackdrop.png')} style={styles.backgroundImage}>
      <Image source={require('../assets/MissleWarsTitle.png')} style={styles.titleImage} />
      <Image source={require('../assets/SHOP.png')} style={styles.shopImage} />
      <View style={styles.headerContainer}>
        <View style={styles.currencyContainer}>
          <Text style={storepagestyles.currencyText}>🪙{currencyAmount}</Text>
        </View>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isPremiumStore ? styles.coinsButton : styles.premiumButton,
            ]}
            onPress={() => setIsPremiumStore(!isPremiumStore)} // Add logic to switch out the free store items for the premium items when clicked.
          >
            <Text style={styles.toggleButtonText}>
              {isPremiumStore ? 'Premium' : 'Coins'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainerMissiles}>
        {['All', 'Missiles', 'Landmines', 'Loot Drops'].map((category) => (
          <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={styles.tabMissiles}>
            <Text style={styles.missileTabText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.container}>
        {isCartVisible ? (
          <Cart cart={cart} onRemove={handleRemove} />
        ) : (
          <>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderButton}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.contentContainer}
            />
            <TouchableOpacity onPress={() => setCartVisible(true)} style={styles.cartButton}>
              <Text style={styles.cartButtonText}>Go to Cart</Text>
            </TouchableOpacity>
          </>
        )}
        {isCartVisible && (
          <TouchableOpacity onPress={() => setCartVisible(false)} style={styles.cartButton}>
            <Text style={styles.cartButtonText}>Back to Products</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({ //Styles made by NightSpark 
  container: {
    flex: 1,
    backgroundColor: '#F3F6EC',
    padding: 16,
    justifyContent: 'center',
  },
  backgroundImage: {
    flex: 1,
    marginTop: -30, // Fills the whole top part of the screen
    resizeMode: 'cover',
  },
  titleImage: {
    width: 350,
    height: 100,
    position: 'absolute',
    top: 70,
    left: 37,
  },
  shopImage: {
    width: 110,
    height: 80,
    top: 120,
    left: 160,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centers the currency container
    marginHorizontal: 20,
    marginVertical: 10,
    marginTop: 105,
  },
  currencyContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 205,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#753663',
  },
  tabContainerMissiles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 6,
  },
  tabMissiles: {
    width: 100,
    height: 40,
    backgroundColor: '#753663',
    padding: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7, // Space between
  },
  missileTabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    //fontFamily: 'Noto Sans Regular', // Need to import!!
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
  },
  button: {
    width: 110,
    height: 110,
    margin: 11,
    backgroundColor: '#DDD5F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#7B5370',
    borderWidth: 1,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5, // for Android
  },
  buttonImage: {
    width: '50%',
    height: '70%',
    resizeMode: 'cover',
  },
  buttonText: {
    color: '#753663',
    borderColor: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -5,
    marginBottom: -5,
  },
  cartButton: {
    backgroundColor: '#753663',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    width: 100,
    height: 40,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 61,
  },
  coinsButton: {
    backgroundColor: '#DDD5F3',
  },
  premiumButton: {
    backgroundColor: '#5a2b5f',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StorePage;