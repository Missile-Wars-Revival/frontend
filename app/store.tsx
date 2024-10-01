import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, ImageBackground, ImageSourcePropType, SafeAreaView, StyleSheet, useColorScheme, Dimensions, Animated, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Cart from '../components/Store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import axios from 'axios';
import Purchases from 'react-native-purchases';
import { addmoney } from '../api/money';
import { additem } from '../api/add-item';
import { getWeaponTypes, mapProductType, PremProduct, Product, shopimages } from '../api/store';
import { getShopStyles } from '../map-themes/stylesheet';

const { width, height } = Dimensions.get('window');

export const getImageForProduct = (identifier: string): ImageSourcePropType => {
  return shopimages[identifier] || shopimages.default;
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
  const [cartTotal, setCartTotal] = useState<number>(0);

  const sortedWeapons = React.useMemo(() => {
    return [...weapons].sort((a, b) => a.price - b.price);
  }, [weapons]);

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        const response = await getWeaponTypes();
        const { landmineTypes, missileTypes, otherTypes } = response;

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

        const mappedOther = otherTypes.map((other: any) => ({
          id: other.name,
          name: other.name,
          type: 'Other',
          price: other.price,
          image: getImageForProduct(other.name),
          description: other.description,
          duration: other.duration,
          radius: other.radius,
        }));

        setWeapons([...mappedMissiles, ...mappedLandmines, ...mappedOther]);
      } catch (error) {
        console.error('Error fetching weapons:', error);
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
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        setCart(parsedCart);
        updateCartTotal(parsedCart);
      }
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
        const totalMoney = response.data.money - cartTotal;
        setCurrencyAmount(totalMoney);
        const moneyAsString = String(totalMoney);
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
  }, [cartTotal]);

  const updateCartTotal = (currentCart: { product: Product; quantity: number }[]) => {
    const total = currentCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    setCartTotal(total);
  };

  const addToCart = (product: Product) => {
    if (currencyAmount >= product.price) {
      setCart((prevCart) => {
        const cartItem = prevCart.find((item) => item.product.id === product.id);
        let newCart;
        if (cartItem) {
          newCart = prevCart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          newCart = [...prevCart, { product, quantity: 1 }];
        }
        AsyncStorage.setItem('cartitems', JSON.stringify(newCart));
        updateCartTotal(newCart);
        return newCart;
      });
      setCurrencyAmount(prevAmount => prevAmount - product.price);
    } else {
      alert('Not enough currency!');
    }
  };

  const handleRemove = (productId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.product.id !== productId);
      AsyncStorage.setItem('cartitems', JSON.stringify(updatedCart));
      updateCartTotal(updatedCart);
      return updatedCart;
    });
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
  const styles = getShopStyles(isDarkMode ? 'dark' : 'light');

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
      <ScrollView style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
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
                <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Damage: {selectedWeapon.damage} per 30 seconds</Text>
              </>
            )}
            {selectedWeapon.type === 'Landmines' && (
              <>
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Duration: {selectedWeapon.duration} hours</Text>
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Damage: {selectedWeapon.damage}</Text>
              </>
            )}
            {selectedWeapon.type === 'Other' && (
              <>
               <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Duration: {selectedWeapon.duration} hours</Text>
               <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Radius: {selectedWeapon.radius} m</Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
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
      {['All', 'Missiles', 'Landmines', 'Other'].map((category) => (
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
              data={selectedCategory === 'All' 
                ? sortedWeapons 
                : sortedWeapons.filter(p => p.type === selectedCategory || (selectedCategory === 'Other' && (p.type === 'Other' || p.type === 'Loot Drops')))}
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
                  data={selectedCategory === 'All' ? sortedWeapons : sortedWeapons.filter(p => p.type === selectedCategory || (selectedCategory === 'Other' && (p.type === 'Other' || p.type === 'Loot Drops')))}
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

export default StorePage;