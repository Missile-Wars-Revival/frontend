import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, Pressable, StyleSheet, useColorScheme, Animated, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Cart from '../../components/Store/cart';
import { CartBottomSheet } from '../../components/Store/CartBottomSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import { isAxiosError } from 'axios';
import Purchases from 'react-native-purchases';
import { addmoney } from '../../api/money';
import { additem } from '../../api/add-item';
import { getWeaponTypes, mapProductType, PremProduct, Product, getImages } from '../../api/store';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useOnboarding } from '../../util/Context/onboardingContext';
import { getPalette, Gradients, Spacing, Radius, cardShadow, floatingAboveTabBar, type ThemePalette } from '../../components/ui/theme';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PressableScale } from '../../components/ui/PressableScale';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { haptics } from '../../components/ui/haptics';
import { triggerGameEffect } from '../../components/effects/game-effects';

const DEV_OFFLINE_TOKEN = 'dev-offline-token';

export const products: Product[] = [];

const CATEGORIES = ['All', 'Missiles', 'Landmines', 'Other'] as const;

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  All: 'grid',
  Missiles: 'rocket',
  Landmines: 'radio-button-on',
  Other: 'sparkles',
};

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(0);
  const [isPremiumStore, setIsPremiumStore] = useState<boolean>(false);
  const [premiumProducts, setPremiumProducts] = useState<PremProduct[]>([]);
  const [weapons, setWeapons] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [isLoadingPremium, setIsLoadingPremium] = useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { currentStep, moveToNextStep } = useOnboarding();

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const insets = useSafeAreaInsets();
  const styles = getStyles(palette, isDarkMode, insets.bottom);

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
      setImagesLoaded(true);
    };
    loadImages();
  }, []);

  useEffect(() => {
    if (currentStep === 'store') {
      moveToNextStep();
    }
  }, [currentStep, moveToNextStep]);

  const getImageSource = useCallback((imageName: string) => {
    if (!imagesLoaded) {
      return require('../../assets/logo.png'); // Default while loading
    }
    return getImageForProduct(imageName);
  }, [imagesLoaded, getImageForProduct]);

  const sortedWeapons = React.useMemo(() => {
    return [...weapons].sort((a, b) => a.price - b.price);
  }, [weapons]);

  const filteredWeapons = React.useMemo(() => {
    if (selectedCategory === 'All') return sortedWeapons;
    return sortedWeapons.filter(p =>
      p.type === selectedCategory ||
      (selectedCategory === 'Other' && (p.type === 'Other' || p.type === 'Loot Drops'))
    );
  }, [sortedWeapons, selectedCategory]);

  const cartCount = React.useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const updateCartTotal = useCallback((currentCart: { product: Product; quantity: number }[]) => {
    const total = currentCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    setCartTotal(total);
  }, []);

  const showCart = useCallback(() => {
    setCartVisible(true);
  }, []);

  const hideCart = useCallback(() => {
    setCartVisible(false);
  }, []);

  useEffect(() => {
    const fetchWeapons = async () => {
      if (!imagesLoaded) return; // Wait for images to load
      try {
        const response = await getWeaponTypes();
        const { landmineTypes, missileTypes, otherTypes } = response;

        const mappedLandmines = landmineTypes.map((landmine: any) => ({
          id: landmine.name,
          name: landmine.name,
          type: 'Landmines',
          price: landmine.price,
          image: getImageSource(landmine.name),
          description: landmine.description,
          damage: landmine.damage,
          duration: landmine.duration,
        }));

        const mappedMissiles = missileTypes.map((missile: any) => ({
          id: missile.name,
          name: missile.name,
          type: 'Missiles',
          price: missile.price,
          image: getImageSource(missile.name),
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
          image: getImageSource(other.name),
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
  }, [imagesLoaded, getImageSource]);

  // fetch items in store
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingPremium(true);
      const offerings = await Purchases.getOfferings().catch((error) => {
        console.error('Failed to fetch offerings:', error);
        return null;
      });
      if (offerings?.current) {
        const mappedProducts = offerings.current.availablePackages.map(pkg => ({
          id: pkg.product.identifier,
          name: pkg.product.title.trim(),
          type: mapProductType(pkg.product.identifier),
          price: pkg.product.price,
          displayprice: pkg.product.priceString,
          image: getImageSource(pkg.product.identifier),
          description: pkg.product.description,
          sku: pkg.product.identifier,
        }));
        setPremiumProducts(mappedProducts);
      } else if (offerings) {
        console.log('No offerings available');
      }
      setIsLoadingPremium(false);
    };

    fetchProducts();
  }, [getImageSource]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCurrencyAmount = async () => {
      const token = await SecureStore.getItemAsync("token");
      try {
        if (!token) {
          console.log('Token not found');
          return;
        }

        if (token === DEV_OFFLINE_TOKEN) {
          const cachedMoney = await AsyncStorage.getItem('Money');
          const parsedMoney = cachedMoney ? Number(cachedMoney) : 0;
          setCurrencyAmount(Number.isNaN(parsedMoney) ? 0 : parsedMoney);
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
        if (isAxiosError(error)) {
          console.error('Axios error:', error.message);
        } else {
          console.error('Error fetching currency amount:', error);
        }
      }
    };

    fetchCurrencyAmount();
  }, [cartTotal]);

  const addToCart = useCallback((product: Product) => {
    if (currencyAmount >= product.price) {
      // Coin-clink haptic + full-screen Skia coin burst.
      triggerGameEffect('coinBurst');
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
      haptics.warning();
      Alert.alert('Not enough coins', 'Earn more coins or top up in the Premium store.');
    }
  }, [currencyAmount, updateCartTotal]);

  const handleRemove = useCallback((productId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.product.id !== productId);
      AsyncStorage.setItem('cartitems', JSON.stringify(updatedCart));
      updateCartTotal(updatedCart);
      return updatedCart;
    });
  }, [updateCartTotal]);

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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (currentStep === 'filter_missiles' && category === 'Missiles') {
      moveToNextStep();
    } else if (currentStep === 'filter_landmines' && category === 'Landmines') {
      moveToNextStep();
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    if (currentStep === 'buy_missile' && product.type === 'Missiles') {
      moveToNextStep();
    } else if (currentStep === 'buy_landmine' && product.type === 'Landmines') {
      moveToNextStep();
    }
  };

  const handleShowCart = useCallback(() => {
    showCart();
    if (currentStep === 'go_to_cart') {
      moveToNextStep();
    }
  }, [currentStep, moveToNextStep, showCart]);

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

  const renderDetailStat = (icon: React.ComponentProps<typeof Ionicons>['name'], label: string, value: string) => (
    <View style={styles.statRow} key={label}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={palette.accent} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderProductDetails = () => {
    if (!selectedProduct) return null;

    return (
      <View style={styles.detailCard}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailImageWrap}>
            <Image
              source={selectedProduct.image}
              style={styles.detailImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
          <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
          <View style={styles.detailPriceRow}>
            <View style={styles.coinChipSmall}>
              <Text style={styles.coinChipSmallText}>🪙 {selectedProduct.price}</Text>
            </View>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{selectedProduct.type}</Text>
            </View>
          </View>
          <Text style={styles.detailDescription}>{selectedProduct.description}</Text>
          <View style={styles.statsCard}>
            {selectedProduct.type === 'Missiles' && (
              <>
                {renderDetailStat('speedometer', 'Speed', `${selectedProduct.speed} m/s`)}
                {renderDetailStat('radio', 'Radius', `${selectedProduct.radius} m`)}
                {renderDetailStat('cloud', 'Fallout', `${selectedProduct.fallout} mins`)}
                {renderDetailStat('flash', 'Damage', `${selectedProduct.damage} / 30s`)}
              </>
            )}
            {selectedProduct.type === 'Landmines' && (
              <>
                {renderDetailStat('time', 'Duration', `${selectedProduct.duration} hours`)}
                {renderDetailStat('flash', 'Damage', `${selectedProduct.damage}`)}
              </>
            )}
            {selectedProduct.type === 'Other' && (
              <>
                {renderDetailStat('time', 'Duration', formatDuration(selectedProduct.duration))}
                {renderDetailStat('radio', 'Radius', selectedProduct.radius !== undefined ? `${selectedProduct.radius} m` : 'N/A')}
              </>
            )}
          </View>
          <PressableScale
            haptic="tap"
            onPress={() => {
              addToCart(selectedProduct);
              closeModal();
            }}
          >
            <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.detailAddButton}>
              <Ionicons name="cart" size={20} color="#FFFFFF" />
              <Text style={styles.detailAddButtonText}>Add to Cart</Text>
            </LinearGradient>
          </PressableScale>
        </ScrollView>
      </View>
    );
  };

  const renderCategoryChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
    >
      {CATEGORIES.map((category) => {
        const active = selectedCategory === category;
        return (
          <PressableScale
            key={category}
            haptic="select"
            onPress={() => handleCategorySelect(category)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Ionicons
              name={CATEGORY_ICONS[category] ?? 'grid'}
              size={14}
              color={active ? '#FFFFFF' : palette.textMuted}
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );

  const renderProductCard = ({ item, index }: { item: Product; index: number }) => (
    <AnimatedEntrance index={index} stagger={30} style={styles.cardWrap}>
      <PressableScale haptic="select" style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.cardImageWrap}>
          <Image
            source={getImageSource(item.name)}
            style={styles.cardImage}
            placeholder={require('../../assets/logo.png')}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        </View>
        <Text style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        <Text style={styles.cardPrice}>🪙 {item.price}</Text>
        <PressableScale haptic="tap" onPress={() => handleAddToCart(item)}>
          <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardAddButton}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.cardAddButtonText}>Add</Text>
          </LinearGradient>
        </PressableScale>
      </PressableScale>
    </AnimatedEntrance>
  );

  const renderPremiumCard = ({ item, index }: { item: PremProduct; index: number }) => (
    <AnimatedEntrance index={index} stagger={30} style={styles.cardWrap}>
      <PressableScale
        haptic="tap"
        style={styles.card}
        onPress={() => {
          if (!isPurchasing) {
            buyItem(item).then(result => {
              if (result.status === 'success') {
                // Triumph haptic + full-screen Skia celebration; let the burst
                // play before the alert covers the centre of the screen.
                triggerGameEffect('purchaseSuccess');
                setTimeout(() => Alert.alert('Success', result.message), 700);
              } else if (result.status !== 'user_cancelled') {
                haptics.error();
                Alert.alert('Purchase Failed', `${result.status}. ${result.error || ''}`);
              }
            });
          }
        }}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator size="small" color={palette.accent} />
        ) : (
          <>
            <View style={styles.cardImageWrap}>
              <Image
                source={item.image}
                style={styles.cardImage}
                placeholder={require('../../assets/logo.png')}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>
            <Text style={styles.cardName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
            <View style={styles.premiumPricePill}>
              <Text style={styles.premiumPriceText}>{item.displayprice}</Text>
            </View>
          </>
        )}
      </PressableScale>
    </AnimatedEntrance>
  );

  const renderCartSheet = () => (
    <CartBottomSheet
      visible={isCartVisible}
      onClose={hideCart}
      palette={palette}
      isDark={isDarkMode}
      bottomInset={insets.bottom}
    >
      <Cart cart={cart} onRemove={handleRemove} bottomInset={insets.bottom} />
    </CartBottomSheet>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header: title + coin balance */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Store</Text>
          <Text style={styles.headerSubtitle}>Stock up your arsenal</Text>
        </View>
        <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coinPill}>
          <Text style={styles.coinPillText}>🪙 {currencyAmount}</Text>
        </LinearGradient>
      </View>

      {/* Coins / Premium segmented control */}
      <View style={styles.segmentWrap}>
        <SegmentedControl
          palette={palette}
          value={isPremiumStore ? 'premium' : 'coins'}
          onChange={(mode) => setIsPremiumStore(mode === 'premium')}
          options={[
            { value: 'coins', label: 'Coin Shop', icon: 'wallet' },
            { value: 'premium', label: 'Premium', icon: 'diamond' },
          ]}
        />
      </View>

      <View style={styles.catalogBody}>
        {!isPremiumStore ? (
          <>
            {renderCategoryChips()}
            <View style={styles.catalogListWrap}>
              <FlatList
                style={styles.catalogList}
                data={filteredWeapons}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProductCard}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
            {cartCount > 0 && (
              <PressableScale haptic="tap" onPress={handleShowCart} style={styles.cartBarWrap}>
                <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cartBar}>
                  <View style={styles.cartBarLeft}>
                    <Ionicons name="cart" size={20} color="#FFFFFF" />
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{cartCount}</Text>
                    </View>
                  </View>
                  <Text style={styles.cartBarText}>View Cart  ·  🪙 {cartTotal}</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
              </PressableScale>
            )}
          </>
        ) : (
          isLoadingPremium ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.accent} />
              <Text style={styles.loadingText}>Loading premium products...</Text>
            </View>
          ) : (
            <FlatList
              style={styles.catalogList}
              data={premiumProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPremiumCard}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </View>

      {renderCartSheet()}

      {/* Product detail modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={{
              width: '100%',
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: animation,
            }}
          >
            {renderProductDetails()}
          </Animated.View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const CART_BAR_HEIGHT = 56;

const getStyles = (palette: ThemePalette, isDark: boolean, bottomInset: number) => {
  const cartBarBottom = floatingAboveTabBar(bottomInset, Spacing.xs);

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 2,
  },
  coinPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    ...cardShadow(isDark),
  },
  coinPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  segmentWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  catalogBody: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  catalogListWrap: {
    flex: 1,
    minHeight: 0,
  },
  catalogList: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: CART_BAR_HEIGHT + cartBarBottom + Spacing.lg,
    gap: Spacing.md,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    ...cardShadow(isDark),
  },
  cardImageWrap: {
    width: '100%',
    height: 84,
    borderRadius: Radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardImage: {
    width: 64,
    height: 64,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  cardAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  cardAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumPricePill: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    backgroundColor: palette.surfaceAlt,
  },
  premiumPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.accent,
  },
  cartBarWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: cartBarBottom,
    zIndex: 20,
    elevation: 20,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
    ...cardShadow(isDark),
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    marginLeft: -8,
    marginTop: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4D67',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cartBarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: palette.textMuted,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    padding: Spacing.xl,
  },
  detailCard: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...cardShadow(isDark),
  },
  detailImageWrap: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  detailImage: {
    width: 110,
    height: 110,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  detailPriceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  coinChipSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
    backgroundColor: palette.surfaceAlt,
  },
  coinChipSmallText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.text,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
    backgroundColor: isDark ? 'rgba(142, 142, 255, 0.18)' : 'rgba(91, 91, 240, 0.12)',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.accent,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconWrap: {
    width: 26,
    alignItems: 'flex-start',
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.text,
  },
  detailAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
  },
  detailAddButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
};

export default StorePage;
