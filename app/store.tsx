import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, ImageBackground, ImageSourcePropType, SafeAreaView, StyleSheet, useColorScheme, Dimensions, Animated } from 'react-native';
import Cart from '../components/Store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import axios from 'axios';
import Purchases from 'react-native-purchases';
import { addmoney } from '../api/money';
import { additem } from '../api/add-item';

export interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  image: any;
  description: string;
  sku?: string;
}

export interface PremProduct {
  id: string;
  name: string;
  type: string;
  price: number;
  displayprice: string;
  image: any;
  description: string;
  sku?: string;
}

export const products: Product[] = [
  { id: "1", name: 'Amplifier', price: 250, image: require('../assets/missiles/Amplifier.png'), description: 'High impact missile', sku: "Amplifier", type: 'Missiles' },
  { id: "2", name: 'Ballista', price: 500, image: require('../assets/missiles/Ballista.png'), description: 'Long-range missile', sku: "Ballista", type: 'Missiles' },
  { id: "3", name: 'BigBertha', price: 500, image: require('../assets/missiles/BigBertha.png'), description: 'Large warhead missile', sku: "Big Bertha", type: 'Landmines' },
  { id: "4", name: 'Bombabom', price: 400, image: require('../assets/missiles/Bombabom.png'), description: 'Cluster bomb missile', sku: "Bombabom", type: 'Landmines' },
  { id: "4", name: 'BunkerBlocker', price: 2000, image: require('../assets/missiles/BunkerBlocker.png'), description: 'Bunker Blocker', sku: "BunkerBlocker", type: 'Landmines' },
  { id: "6", name: 'Buzzard', price: 3000, image: require('../assets/missiles/Buzzard.png'), description: 'Medium-range missile', sku: "Buzzard", type: 'Missiles' },
  { id: "7", name: 'ClusterBomb', price: 4500, image: require('../assets/missiles/ClusterBomb.png'), description: 'ClusterBomb missile', sku: "ClusterBomb", type: 'Missiles' },
  { id: "8", name: 'CorporateRaider', price: 2000, image: require('../assets/missiles/CorporateRaider.png'), description: 'CorporateRaider missile', sku: "CorporateRaider", type: 'Missiles' },
  { id: "9", name: 'GutShot', price: 500, image: require('../assets/missiles/GutShot.png'), description: 'GutShot missile', sku: "GutShot", type: 'Missiles' },
  { id: "10", name: 'TheNuke', price: 10000, image: require('../assets/missiles/TheNuke.png'), description: 'Nuclear missile', sku: "The_Nuke", type: 'Missiles' },
  { id: "11", name: 'Yokozuna', price: 3000, image: require('../assets/missiles/Yokozuna.png'), description: 'Yokozuna missile', sku: "Yokozuna", type: 'Missiles' },
  { id: "13", name: 'Zippy', price: 250, image: require('../assets/missiles/Zippy.png'), description: 'Zippy', sku: "Zippy", type: 'Missiles' },
  { id: "20", name: 'LootDrop', price: 400, image: require('../assets/mapassets/Airdropicon.png'), description: 'A Loot Drop', sku: "Loot Drop", type: 'Loot Drops' },
];

const { width, height } = Dimensions.get('window');

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(0);
  const [isPremiumStore, setIsPremiumStore] = useState<boolean>(false);
  const [premiumProducts, setPremiumProducts] = useState<PremProduct[]>([]);
  const [cartAnimation] = useState(new Animated.Value(0));

  //match items to category 
  const mapProductType = (productid: string) => {
    switch (productid) {
      case "Amplifier":
        return "Missiles";
      case "Ballista":
        return "Missiles";
      case "BigBertha":
        return "Landmine";
      case "BunkerBlocker":
        return "Landmine";
      case "Buzzard":
        return "Missiles";
      case "ClusterBomb":
        return "Missiles";
      case "CorporateRaider":
        return "Missiles";
      case "GutShot":
        return "Missiles";
      case "Yokozuna":
        return "Missiles";
      case "Zippy":
        return "Missiles";
      case "Coins500_":
        return "Coins";
      case "Coins1000_":
        return "Coins";
      case "Coins2000_":
        return "Coins";
      default:
        return "Other";
    }
  };

  const images: any = {
    Amplifier: require('../assets/missiles/Amplifier.png'),
    Ballista: require('../assets/missiles/Ballista.png'),
    BigBertha: require('../assets/missiles/BigBertha.png'),
    Bombabom: require('../assets/missiles/Bombabom.png'),
    BunkerBlocker: require('../assets/missiles/BunkerBlocker.png'),
    Buzzard: require('../assets/missiles/Buzzard.png'),
    ClusterBomb: require('../assets/missiles/ClusterBomb.png'),
    CorporateRaider: require('../assets/missiles/CorporateRaider.png'),
    GutShot: require('../assets/missiles/GutShot.png'),
    TheNuke: require('../assets/missiles/TheNuke.png'),
    Yokozuna: require('../assets/missiles/Yokozuna.png'),
    Zippy: require('../assets/missiles/Zippy.png'),
    Coins500_: require('../assets/store/500coins.png'),
    Coins1000_: require('../assets/store/1000coins.png'),
    Coins2000_: require('../assets/store/1000coins.png'),
    default: require('../assets/logo.png'), // Default image if identifier not found
  };

  const getImageForProduct = (identifier: string): ImageSourcePropType => {
    return images[identifier] || images.default;
  };
// fetch items in store
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          const mappedProducts = offerings.current.availablePackages.map(pkg => ({
            id: pkg.product.identifier,
            name: pkg.product.title.trim(),
            type: mapProductType(pkg.product.identifier),
            price: pkg.product.price,
            displayprice: pkg.product.priceString,
            image: getImageForProduct(pkg.product.identifier),
            description: pkg.product.description,
            sku: pkg.product.identifier,
          }));
          setPremiumProducts(mappedProducts);
          //console.log(mappedProducts)
        } else {
          console.log('No offerings available');
        }
      } catch (error) {
        console.error('Failed to fetch offerings:', error);
      }
    };

    fetchProducts();
  }, []);

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
        const moneyAsString = String(response.data.money);
        await AsyncStorage.setItem("Money", moneyAsString);
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

  //buys item - SET API TOKENS IN _LAYOUT.TSX
  const buyItem = async (product: PremProduct) => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.log('Token not found');
      return { status: 'token_not_found' };
    }

    if (!product.sku) {
      console.log('Product SKU not found');
      return { status: 'sku_not_found' };
    }

    try {
      // First, retrieve the product details from RevenueCat
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        const storeProduct = offerings.current.availablePackages.find(p => p.product.identifier === product.sku);

        if (!storeProduct) {
          console.log('Store product not found');
          return { status: 'store_product_not_found' };
        }

        // Handle the purchase with the store product
        const { customerInfo } = await Purchases.purchaseStoreProduct(storeProduct.product);
        if (customerInfo.entitlements.active[product.type]) {
          console.log('Product purchased and entitlement active');

          switch (product.type) {
            case 'Coins':
              const amount = parseInt(product.description, 10);
              if (!isNaN(amount)) {
                await addmoney(token, amount);
                console.log(`Added ${amount} coins to user's account.`);
              } else {
                console.log('Invalid coin amount.');
                return { status: 'invalid_coin_amount' };
              }
              break;
            case 'Missiles':
              await additem(token, product.name, product.type);
              console.log(`Added a missile (${product.name}) to inventory.`);
              break;
            default:
              console.log('Unknown product type.');
              return { status: 'unknown_product_type' };
          }
          return { status: 'success' };
        } else {
          console.log('Entitlement not active');
          return { status: 'entitlement_inactive' };
        }
      } else {
        console.log('No offerings available');
        return { status: 'offerings_not_found' };
      }
    } catch (e) {
      // Properly type-check the error before handling it
      if (e instanceof Error) {
        console.error('RevenueCat purchase error:', e.message);
        if (e.message === "User cancelled") {
          return { status: 'user_cancelled' };
        }
        return { status: 'purchase_error', error: e.message };
      } else {
        // Handle cases where the error is not an instance of Error
        console.error('An unexpected error occurred');
        return { status: 'unexpected_error', error: 'An unexpected error occurred' };
      }
    }
  };

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.type === selectedCategory);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme ?? 'light');

  const renderButton = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productButton} onPress={() => addToCart(item)}>
      <Image source={item.image} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>🪙{item.price}</Text>
    </TouchableOpacity>
  );

  const premrenderButton = ({ item }: { item: PremProduct }) => (
    <TouchableOpacity style={styles.productButton} onPress={() => buyItem(item).then(result => console.log(result))}>
      <Image source={item.image} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.displayprice}</Text>
    </TouchableOpacity>
  );

  const renderTabs = () => (
    <View style={styles.tabContainerMissiles}>
      {['All', 'Missiles', 'Landmines', 'Loot Drops'].map((category) => (
        <TouchableOpacity 
          key={category} 
          onPress={() => setSelectedCategory(category)} 
          style={[
            styles.tabMissiles,
            selectedCategory === category && styles.selectedTab
          ]}
        >
          <Text style={[
            styles.missileTabText,
            selectedCategory === category && styles.selectedTabText
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const showCart = () => {
    setCartVisible(true);
    Animated.spring(cartAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideCart = () => {
    Animated.spring(cartAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => setCartVisible(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../assets/store/mapbackdrop.png')} style={styles.backgroundImage}>
        <Image source={require('../assets/MissleWarsTitle.png')} style={styles.titleImage} />
        <Image source={require('../assets/store/SHOP.png')} style={styles.shopImage} />
        <View style={styles.headerContainer}>
          <View style={styles.currencyContainer}>
            <Text style={styles.currencyText} numberOfLines={1} ellipsizeMode="tail">
              🪙{currencyAmount}
            </Text>
          </View>
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isPremiumStore ? styles.coinsButton : styles.premiumButton,
              ]}
              onPress={() => setIsPremiumStore(!isPremiumStore)}
            >
              <Text style={styles.toggleButtonText}>
                {isPremiumStore ? 'Premium' : 'Coins'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isPremiumStore && (
          <>
            {renderTabs()}
            <View style={styles.container}>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderButton}
                numColumns={3}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.contentContainer}
              />
              <TouchableOpacity onPress={showCart} style={styles.cartButton}>
                <Text style={styles.cartButtonText}>Go to Cart</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {isPremiumStore && (
          <View style={styles.container}>
            <FlatList
              data={premiumProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={premrenderButton}
              numColumns={3}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.contentContainer}
            />
          </View>
        )}

        {isCartVisible && (
          <Animated.View style={[
            styles.cartContainer,
            {
              transform: [{
                translateY: cartAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
              }],
            },
          ]}>
            <Cart cart={cart} onRemove={handleRemove} />
            <TouchableOpacity onPress={hideCart} style={styles.cartButton}>
              <Text style={styles.cartButtonText}>Back to Products</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark' | null) => StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f0f2f5',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  titleImage: {
    width: width * 0.8,
    height: height * 0.1,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: height * 0.02,
  },
  shopImage: {
    width: width * 0.7,
    height: height * 0.08,
    resizeMode: 'stretch',
    alignSelf: 'center',
    marginTop: -25,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginTop: -15,
  },
  currencyContainer: {
    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
    borderRadius: 20,
    padding: 10,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#fff' : '#000',
  },
  switchContainer: {
    // Add any specific styles for the switch container if needed
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  coinsButton: {
    backgroundColor: '#ffd700',
  },
  premiumButton: {
    backgroundColor: '#4a5568',
  },
  toggleButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainerMissiles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  tabMissiles: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
  },
  selectedTab: {
    backgroundColor: colorScheme === 'dark' ? '#555' : '#e0e0e0',
  },
  missileTabText: {
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#fff' : '#000',
  },
  selectedTabText: {
    color: colorScheme === 'dark' ? '#fff' : '#000',
  },
  columnWrapper: {
    justifyContent: 'space-around',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  productButton: {
    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    margin: 5,
    width: width * 0.28,
  },
  productImage: {
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: 'contain',
  },
  productName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    color: colorScheme === 'dark' ? '#fff' : '#000',
  },
  productPrice: {
    fontSize: 12,
    color: colorScheme === 'dark' ? '#ccc' : '#666',
  },
  cartButton: {
    backgroundColor: '#773765',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 10,
  },
  cartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f0f2f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
});

export default StorePage;