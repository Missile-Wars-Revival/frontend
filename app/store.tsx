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
import { getWeaponTypes, mapProductType, PremProduct, Product, getImages } from '../api/store';
import { getShopStyles } from '../map-themes/stylesheet';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export const products: Product[] = [
  // { id: "20", name: 'LootDrop', price: 400, image: require('../assets/mapassets/Airdropicon.png'), description: 'A Loot Drop', type: 'Loot Drops' },
  // { id: "21", name: 'Shield', price: 2000, image: require('../assets/mapassets/shield.png'), description: 'A Standard Shield', type: 'Other' },
  // { id: "22", name: 'UltraShield', price: 5000, image: require('../assets/mapassets/shield.png'), description: 'A Ultra Shield', type: 'Other' },

];


const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(0);
  const [isPremiumStore, setIsPremiumStore] = useState<boolean>(false);
  const [premiumProducts, setPremiumProducts] = useState<PremProduct[]>([]);
  const [cartAnimation] = useState(new Animated.Value(0));
  const [weapons, setWeapons] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [isLoadingPremium, setIsLoadingPremium] = useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../assets/logo.png'));

useEffect(() => {
  const loadImages = async () => {
    const imageGetter = await getImages();
    setGetImageForProduct(() => imageGetter);
  };
  loadImages();
}, []);

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

        setWeapons([...mappedMissiles, ...mappedLandmines, ...mappedOther, ...products]);
      } catch (error) {
        console.error('Error fetching weapons:', error);
      }
    };

    fetchWeapons();
  }, [getImageForProduct]);

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

  // Add these new styles or modify existing ones
  const updatedStyles = StyleSheet.create({
    ...styles,
    productImage: {
      ...styles.productImage,
      width: 80,  // Set a fixed width
      height: 80, // Set a fixed height
      resizeMode: 'contain', // This ensures the image fits within the dimensions while maintaining aspect ratio
    },
    modalImage: {
      ...styles.modalImage,
      width: 120, // Larger size for the modal
      height: 120,
      resizeMode: 'contain',
    },
  });

  const handlePress = (product: Product) => {
    setSelectedProduct(product);
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
      setSelectedProduct(null);
    });
  };

  const renderProductDetails = () => {
    if (!selectedProduct) return null;

    const formatDuration = (minutes: number | undefined) => {
      if (minutes === undefined) return 'N/A';
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (hours === 0) {
        return `${remainingMinutes} mins`;
      } else if (remainingMinutes === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} mins`;
      }
    };

    return (
      <ScrollView style={[updatedStyles.modalContainer, isDarkMode && updatedStyles.modalContainerDark]}>
        <View style={updatedStyles.modalHeader}>
          <Image source={selectedProduct.image} style={updatedStyles.modalImage} />
          <View style={updatedStyles.modalTitleContainer}>
            <Text style={[updatedStyles.modalTitle, isDarkMode && updatedStyles.modalTitleDark]}>{selectedProduct.name}</Text>
            <Text style={[updatedStyles.modalPrice, isDarkMode && updatedStyles.modalPriceDark]}>🪙{selectedProduct.price}</Text>
          </View>
        </View>
        <View style={updatedStyles.modalContent}>
          <Text style={[updatedStyles.modalDescription, isDarkMode && updatedStyles.modalDescriptionDark]}>{selectedProduct.description}</Text>
          <View style={updatedStyles.modalStatsContainer}>
            {selectedProduct.type === 'Missiles' && (
              <>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>Speed: {selectedProduct.speed} m/s</Text>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>Radius: {selectedProduct.radius} m</Text>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>Fallout: {selectedProduct.fallout} mins</Text>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>Damage: {selectedProduct.damage} per 30 seconds</Text>
              </>
            )}
            {selectedProduct.type === 'Landmines' && (
              <>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>Duration: {selectedProduct.duration} hours</Text>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>Damage: {selectedProduct.damage}</Text>
              </>
            )}
            {selectedProduct.type === 'Other' && (
              <>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>
                  Duration: {formatDuration(selectedProduct.duration)}
                </Text>
                <Text style={[updatedStyles.modalText, isDarkMode && updatedStyles.modalTextDark]}>
                  Radius: {selectedProduct.radius !== undefined ? `${selectedProduct.radius} m` : 'N/A'}
                </Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={[updatedStyles.addToCartButton, isDarkMode && updatedStyles.addToCartButtonDark]} 
          onPress={() => {
            addToCart(selectedProduct);
            closeModal();
          }}
        >
          <Ionicons name="cart" size={24} color={isDarkMode ? "black" : "white"} />
          <Text style={[updatedStyles.addToCartButtonText, isDarkMode && updatedStyles.addToCartButtonTextDark]}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderButton = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={updatedStyles.productButton}
      onPress={() => handlePress(item)}
    >
      <Image source={item.image} style={updatedStyles.productImage} />
      <Text style={[updatedStyles.productName, isDarkMode && updatedStyles.productNameDark]}>
        {item.name}
      </Text>
      <Text style={[updatedStyles.productPrice, isDarkMode && updatedStyles.productPriceDark]}>🪙{item.price}</Text>
      <TouchableOpacity 
        style={[updatedStyles.addToCartButtonSmall, isDarkMode && updatedStyles.addToCartButtonSmallDark]} 
        onPress={() => addToCart(item)}
      >
        <Ionicons name="cart" size={18} color={isDarkMode ? "black" : "white"} />
        <Text style={[updatedStyles.addToCartButtonTextSmall, isDarkMode && updatedStyles.addToCartButtonTextSmallDark]}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const premrenderButton = ({ item }: { item: PremProduct }) => (
    <TouchableOpacity 
      style={updatedStyles.productButton} 
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
          <Image source={item.image} style={updatedStyles.productImage} />
          <Text style={[updatedStyles.productName, isDarkMode && updatedStyles.productNameDark]}>{item.name}</Text>
          <Text style={[updatedStyles.productPrice, isDarkMode && updatedStyles.productPriceDark]}>{item.displayprice}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderTabs = () => (
    <View style={updatedStyles.tabContainerMissiles}>
      {['All', 'Missiles', 'Landmines', 'Other'].map((category) => (
        <TouchableOpacity 
          key={category} 
          onPress={() => setSelectedCategory(category)} 
          style={[
            updatedStyles.tabMissiles,
            selectedCategory === category && updatedStyles.selectedTab
          ]}
        >
          <Text style={[
            updatedStyles.missileTabText,
            selectedCategory === category && updatedStyles.selectedTabText
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
    <SafeAreaView style={[updatedStyles.container, isDarkMode && updatedStyles.containerDark]}>
      {!isDarkMode && (
        <ImageBackground source={require('../assets/store/mapbackdrop.png')} style={updatedStyles.backgroundImage}>
          <Image source={require('../assets/MissleWarsTitle.png')} style={updatedStyles.titleImage} />
          <Image source={require('../assets/store/SHOP.png')} style={updatedStyles.shopImage} />
          <View style={updatedStyles.headerContainer}>
            <View style={updatedStyles.currencyContainer}>
              <Text style={[updatedStyles.currencyText, isDarkMode && updatedStyles.currencyTextDark]}>
                🪙{currencyAmount}
              </Text>
            </View>
            <View style={updatedStyles.switchContainer}>
              <TouchableOpacity
                style={[
                  updatedStyles.toggleButton,
                  isPremiumStore ? updatedStyles.coinsButton : updatedStyles.premiumButton,
                ]}
                onPress={() => setIsPremiumStore(!isPremiumStore)}
              >
                <Text style={updatedStyles.toggleButtonText}>
                  {isPremiumStore ? 'Premium' : 'Coins'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isPremiumStore && (
        <>
          {renderTabs()}
          <View style={updatedStyles.container}>
            <FlatList
              data={selectedCategory === 'All' 
                ? sortedWeapons 
                : sortedWeapons.filter(p => p.type === selectedCategory || (selectedCategory === 'Other' && (p.type === 'Other' || p.type === 'Loot Drops')))}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderButton}
              numColumns={3}
              columnWrapperStyle={updatedStyles.columnWrapper}
              contentContainerStyle={updatedStyles.contentContainer}
            />
            <TouchableOpacity onPress={showCart} style={updatedStyles.cartButton}>
              <Text style={updatedStyles.cartButtonText}>Go to Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

          {isPremiumStore && (
            <View style={updatedStyles.container}>
              {isLoadingPremium ? (
                <View style={updatedStyles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={updatedStyles.loadingText}>Loading premium products...</Text>
                </View>
              ) : (
                <FlatList
                  data={premiumProducts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={premrenderButton}
                  numColumns={3}
                  columnWrapperStyle={updatedStyles.columnWrapper}
                  contentContainerStyle={updatedStyles.contentContainer}
                />
              )}
            </View>
          )}

          {isCartVisible && (
            <Animated.View style={[
              updatedStyles.cartContainer,
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
              <TouchableOpacity onPress={hideCart} style={updatedStyles.cartButton}>
                <Text style={updatedStyles.cartButtonText}>Back to Products</Text>
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
              style={updatedStyles.modalOverlay}
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
                {renderProductDetails()}
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </ImageBackground>
      )}
      {isDarkMode && (
        <View style={updatedStyles.containerDark}>
          <Image source={require('../assets/MissleWarsTitle.png')} style={updatedStyles.titleImage} />
          <Image source={require('../assets/store/SHOP.png')} style={updatedStyles.shopImage} />
          <View style={updatedStyles.headerContainer}>
            <View style={updatedStyles.currencyContainer}>
              <Text style={[updatedStyles.currencyText, isDarkMode && updatedStyles.currencyTextDark]}>
                🪙{currencyAmount}
              </Text>
            </View>
            <View style={updatedStyles.switchContainer}>
              <TouchableOpacity
                style={[
                  updatedStyles.toggleButton,
                  isPremiumStore ? updatedStyles.coinsButton : updatedStyles.premiumButton,
                ]}
                onPress={() => setIsPremiumStore(!isPremiumStore)}
              >
                <Text style={updatedStyles.toggleButtonText}>
                  {isPremiumStore ? 'Premium' : 'Coins'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isPremiumStore && (
            <>
              {renderTabs()}
              <View style={updatedStyles.container}>
                <FlatList
                  data={selectedCategory === 'All' ? sortedWeapons : sortedWeapons.filter(p => p.type === selectedCategory || (selectedCategory === 'Other' && (p.type === 'Other' || p.type === 'Loot Drops')))}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderButton}
                  numColumns={3}
                  columnWrapperStyle={updatedStyles.columnWrapper}
                  contentContainerStyle={updatedStyles.contentContainer}
                />
                <TouchableOpacity onPress={showCart} style={updatedStyles.cartButton}>
                  <Text style={updatedStyles.cartButtonText}>Go to Cart</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isPremiumStore && (
            <View style={updatedStyles.container}>
              {isLoadingPremium ? (
                <View style={updatedStyles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={updatedStyles.loadingText}>Loading premium products...</Text>
                </View>
              ) : (
                <FlatList
                  data={premiumProducts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={premrenderButton}
                  numColumns={3}
                  columnWrapperStyle={updatedStyles.columnWrapper}
                  contentContainerStyle={updatedStyles.contentContainer}
                />
              )}
            </View>
          )}

          {isCartVisible && (
            <Animated.View style={[
              updatedStyles.cartContainer,
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
              <TouchableOpacity onPress={hideCart} style={updatedStyles.cartButton}>
                <Text style={updatedStyles.cartButtonText}>Back to Products</Text>
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
              style={updatedStyles.modalOverlay}
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
                {renderProductDetails()}
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
}
export default StorePage;