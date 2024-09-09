import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, ImageBackground, ImageSourcePropType, SafeAreaView, StyleSheet, useColorScheme, Dimensions, Animated, Modal, ActivityIndicator, Alert } from 'react-native';
import Cart from '../components/Store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import axios from 'axios';
import Purchases from 'react-native-purchases';
import { addmoney } from '../api/money';
import { additem } from '../api/add-item';
import { getWeaponTypes, PremProduct, Product } from '../api/store';


export const products: Product[] = [
  { id: "20", name: 'LootDrop', price: 400, image: require('../assets/mapassets/Airdropicon.png'), description: 'A Loot Drop', type: 'Loot Drops' },
];

const { width, height } = Dimensions.get('window');

// Add this function at the top level of your file
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

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(0);
  const [isPremiumStore, setIsPremiumStore] = useState<boolean>(false);
  const [premiumProducts, setPremiumProducts] = useState<PremProduct[]>([]);
  const [cartAnimation] = useState(new Animated.Value(0));
  const [weapons, setWeapons] = useState<Product[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [isLoadingPremium, setIsLoadingPremium] = useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

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

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        const response = await getWeaponTypes();
        const { landmineTypes, missileTypes } = response;

        const mappedLandmines = landmineTypes.map((landmine: any) => ({
          id: landmine.name,
          name: landmine.name,
          type: 'Landmines',
          price: landmine.price,
          image: getImageForProduct(landmine.name),
          description: landmine.description,
          damage: landmine.damage,
          duration: landmine.duration,
        }));

        const mappedMissiles = missileTypes.map((missile: any) => ({
          id: missile.name,
          name: missile.name,
          type: 'Missiles',
          price: missile.price,
          image: getImageForProduct(missile.name),
          description: missile.description,
          speed: missile.speed,
          radius: missile.radius,
          damage: missile.damage,
          fallout: missile.fallout,
        }));

        setWeapons([...mappedMissiles, ...mappedLandmines, ...products]);
      } catch (error) {
        console.error('Error fetching weapons:', error);
        setWeapons([...products]); // Fallback to just the hard-coded products
      }
    };

    fetchWeapons();
  }, []);

  // fetch items in store
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingPremium(true);
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
        } else {
          console.log('No offerings available');
        }
      } catch (error) {
        console.error('Failed to fetch offerings:', error);
      } finally {
        setIsLoadingPremium(false);
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
    setIsPurchasing(true);
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.log('Token not found');
      setIsPurchasing(false);
      return { status: 'token_not_found' };
    }

    if (!product.sku) {
      console.log('Product SKU not found');
      setIsPurchasing(false);
      return { status: 'sku_not_found' };
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        const storeProduct = offerings.current.availablePackages.find(p => p.product.identifier === product.sku);

        if (!storeProduct) {
          console.log('Store product not found');
          setIsPurchasing(false);
          return { status: 'store_product_not_found' };
        }

        console.log('Attempting to purchase product:', product.name);
        const { customerInfo, productIdentifier } = await Purchases.purchaseStoreProduct(storeProduct.product);
        console.log('Purchase completed. Product Identifier:', productIdentifier);

        // Wait for a short time to allow entitlements to update
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Checking entitlement for product type:', product.type);

        if (customerInfo.entitlements.active[product.type]) {
          console.log('Entitlement active for:', product.type);

          switch (product.type) {
            case 'Coins':
              const amount = parseInt(product.description, 10);
              if (!isNaN(amount)) {
                await addmoney(token, amount);
                console.log(`Added ${amount} coins to user's account.`);
                setIsPurchasing(false);
                return { status: 'success', message: `Added ${amount} coins to your account.` };
              } else {
                console.log('Invalid coin amount.');
                setIsPurchasing(false);
                return { status: 'invalid_coin_amount' };
              }
            case 'Missiles':
              await additem(token, product.name, product.type);
              console.log(`Added a missile (${product.name}) to inventory.`);
              setIsPurchasing(false);
              return { status: 'success', message: `Added ${product.name} to your inventory.` };
            default:
              console.log('Unknown product type:', product.type);
              setIsPurchasing(false);
              return { status: 'unknown_product_type' };
          }
        } else {
          console.log('Entitlement not active for:', product.type);
          console.log('Active entitlements:', JSON.stringify(customerInfo.entitlements.active, null, 2));
          setIsPurchasing(false);
          return { status: 'entitlement_inactive' };
        }
      } else {
        console.log('No offerings available');
        setIsPurchasing(false);
        return { status: 'offerings_not_found' };
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error('RevenueCat purchase error:', e.message);
        if (e.message === "User cancelled") {
          setIsPurchasing(false);
          return { status: 'user_cancelled' };
        }
        setIsPurchasing(false);
        return { status: 'purchase_error', error: e.message };
      } else {
        console.error('An unexpected error occurred');
        setIsPurchasing(false);
        return { status: 'unexpected_error', error: 'An unexpected error occurred' };
      }
    }
  };

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode ? 'dark' : 'light');

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'Missiles':
        return '🚀';
      case 'Landmines':
        return '💣';
      case 'Loot Drops':
        return '📦';
      default:
        return '🎮';
    }
  };

  const handlePress = (weapon: Product) => {
    addToCart(weapon);
  };

  const handleLongPress = (weapon: Product) => {
    setSelectedWeapon(weapon);
    setModalVisible(true);
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedWeapon(null);
    });
  };

  const renderWeaponDetails = () => {
    if (!selectedWeapon) return null;

    return (
      <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
        <View style={styles.modalHeader}>
          <Image source={selectedWeapon.image} style={styles.modalImage} />
          <View style={styles.modalTitleContainer}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>{selectedWeapon.name}</Text>
            <Text style={[styles.modalPrice, isDarkMode && styles.modalPriceDark]}>🪙{selectedWeapon.price}</Text>
          </View>
        </View>
        <View style={styles.modalContent}>
          <Text style={[styles.modalDescription, isDarkMode && styles.modalDescriptionDark]}>{selectedWeapon.description}</Text>
          <View style={styles.modalStatsContainer}>
            {selectedWeapon.type === 'Missiles' && (
              <>
                <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Speed: {selectedWeapon.speed} m/s</Text>
                <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Radius: {selectedWeapon.radius} m</Text>
                <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Fallout: {selectedWeapon.fallout} mins</Text>
              </>
            )}
            {selectedWeapon.type === 'Landmines' && (
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Duration: {selectedWeapon.duration} mins</Text>
            )}
            <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Damage: {selectedWeapon.damage} per 30 seconds</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderButton = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productButton}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <Image source={item.image} style={styles.productImage} />
      <Text style={[styles.productName, isDarkMode && styles.productNameDark]}>
        {getCategoryEmoji(item.type)} {item.name}
      </Text>
      <Text style={[styles.productPrice, isDarkMode && styles.productPriceDark]}>🪙{item.price}</Text>
    </TouchableOpacity>
  );

  const premrenderButton = ({ item }: { item: PremProduct }) => (
    <TouchableOpacity 
      style={styles.productButton} 
      onPress={() => {
        if (!isPurchasing) {
          buyItem(item).then(result => {
            if (result.status === 'success') {
              Alert.alert('Success', result.message);
            } else {
              Alert.alert('Purchase Failed', `${result.status}. ${result.error || ''}`);
            }
          });
        }
      }}
      disabled={isPurchasing}
    >
      {isPurchasing ? (
        <ActivityIndicator size="small" color="#4CAF50" />
      ) : (
        <>
          <Image source={item.image} style={styles.productImage} />
          <Text style={[styles.productName, isDarkMode && styles.productNameDark]}>{item.name}</Text>
          <Text style={[styles.productPrice, isDarkMode && styles.productPriceDark]}>{item.displayprice}</Text>
        </>
      )}
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
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {!isDarkMode && (
        <ImageBackground source={require('../assets/store/mapbackdrop.png')} style={styles.backgroundImage}>
          <Image source={require('../assets/MissleWarsTitle.png')} style={styles.titleImage} />
          <Image source={require('../assets/store/SHOP.png')} style={styles.shopImage} />
          <View style={styles.headerContainer}>
            <View style={styles.currencyContainer}>
              <Text style={[styles.currencyText, isDarkMode && styles.currencyTextDark]}>
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
              data={selectedCategory === 'All' ? weapons : weapons.filter(p => p.type === selectedCategory)}
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
              {isLoadingPremium ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>Loading premium products...</Text>
                </View>
              ) : (
                <FlatList
                  data={premiumProducts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={premrenderButton}
                  numColumns={3}
                  columnWrapperStyle={styles.columnWrapper}
                  contentContainerStyle={styles.contentContainer}
                />
              )}
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

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeModal}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeModal}
            >
              <Animated.View
                style={[
                  {
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                    opacity: animation,
                  },
                ]}
              >
                {renderWeaponDetails()}
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </ImageBackground>
      )}
      {isDarkMode && (
        <View style={styles.containerDark}>
          <Image source={require('../assets/MissleWarsTitle.png')} style={styles.titleImage} />
          <Image source={require('../assets/store/SHOP.png')} style={styles.shopImage} />
          <View style={styles.headerContainer}>
            <View style={styles.currencyContainer}>
              <Text style={[styles.currencyText, isDarkMode && styles.currencyTextDark]}>
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
                  data={selectedCategory === 'All' ? weapons : weapons.filter(p => p.type === selectedCategory)}
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
              {isLoadingPremium ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>Loading premium products...</Text>
                </View>
              ) : (
                <FlatList
                  data={premiumProducts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={premrenderButton}
                  numColumns={3}
                  columnWrapperStyle={styles.columnWrapper}
                  contentContainerStyle={styles.contentContainer}
                />
              )}
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

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeModal}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeModal}
            >
              <Animated.View
                style={[
                  {
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                    opacity: animation,
                  },
                ]}
              >
                {renderWeaponDetails()}
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#1E1E1E',
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
    backgroundColor: `transparent`,
  },
  currencyContainer: {
    backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#fff',
    borderRadius: 20,
    padding: 10,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#FFF' : '#000',
  },
  currencyTextDark: {
    color: '#FFF',
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
    backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#fff',
  },
  selectedTab: {
    backgroundColor: colorScheme === 'dark' ? '#4CAF50' : '#e0e0e0',
  },
  missileTabText: {
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#FFF' : '#000',
  },
  selectedTabText: {
    color: colorScheme === 'dark' ? '#FFF' : '#000',
  },
  columnWrapper: {
    justifyContent: 'space-around',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  productButton: {
    backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    margin: 5,
    width: width * 0.28,
    height: width * 0.4,
    justifyContent: 'space-between',
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
    color: colorScheme === 'dark' ? '#FFF' : '#000',
  },
  productNameDark: {
    color: '#FFF',
  },
  productPrice: {
    fontSize: 12,
    color: colorScheme === 'dark' ? '#B0B0B0' : '#666',
  },
  productPriceDark: {
    color: '#B0B0B0',
  },
  cartButton: {
    backgroundColor: '#4CAF50',
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
    backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#f0f2f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#444' : '#e0e0e0',
  },
  modalImage: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  modalTitleDark: {
    color: '#FFF',
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalPriceDark: {
    color: '#81C784',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  modalDescriptionDark: {
    color: '#B0B0B0',
  },
  modalStatsContainer: {
    backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#f5f5f5',
    borderRadius: 10,
    padding: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  modalTextDark: {
    color: '#E0E0E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colorScheme === 'dark' ? '#FFF' : '#000',
  },
});

export default StorePage;