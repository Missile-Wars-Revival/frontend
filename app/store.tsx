import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, ImageBackground, ImageSourcePropType } from 'react-native';
import Cart from '../components/Store/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mainstorestyles } from '../components/Store/storestylesheets';
import axiosInstance from '../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import axios from 'axios';
import Purchases, { PRODUCT_TYPE } from 'react-native-purchases';
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

const StorePage: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currencyAmount, setCurrencyAmount] = useState<number>(0);
  const [isPremiumStore, setIsPremiumStore] = useState<boolean>(false);
  const [premiumProducts, setPremiumProducts] = useState<PremProduct[]>([]);

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

  const renderButton = ({ item }: { item: Product }) => (
    <TouchableOpacity style={mainstorestyles.button} onPress={() => addToCart(item)}>
      <Text style={mainstorestyles.buttonText}>{item.name}</Text>
      <Image source={item.image} style={mainstorestyles.buttonImage} />
      <Text style={mainstorestyles.buttonText}>🪙{item.price}</Text>
    </TouchableOpacity>
  );

  const premrenderButton = ({ item }: { item: PremProduct }) => (
    <TouchableOpacity style={mainstorestyles.button} onPress={() => buyItem(item).then(result => console.log(result))}>
      <Text style={mainstorestyles.buttonText}>{item.name}</Text>
      <Image source={item.image} style={mainstorestyles.buttonImage} />
      <Text style={mainstorestyles.buttonText}>{item.displayprice}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={require('../assets/store/mapbackdrop.png')} style={mainstorestyles.backgroundImage}>
      <Image source={require('../assets/MissleWarsTitle.png')} style={mainstorestyles.titleImage} />
      <Image source={require('../assets/store/SHOP.png')} style={mainstorestyles.shopImage} />
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

      {(!isPremiumStore) && (
        <><View style={mainstorestyles.tabContainerMissiles}>
          {['All', 'Missiles', 'Landmines', 'Loot Drops'].map((category) => (
            <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={mainstorestyles.tabMissiles}>
              <Text style={mainstorestyles.missileTabText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View><View style={mainstorestyles.container}>
            {isCartVisible ? (
              <Cart cart={cart} onRemove={handleRemove} />
            ) : (
              <>
                <FlatList
                  data={filteredProducts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderButton}
                  numColumns={3}
                  columnWrapperStyle={mainstorestyles.columnWrapper}
                  contentContainerStyle={mainstorestyles.contentContainer} />
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
          </View></>
      )}

      {(isPremiumStore) && (
        <View style={mainstorestyles.container}>
          <>
            <FlatList
              data={premiumProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={premrenderButton}
              numColumns={3}
              columnWrapperStyle={mainstorestyles.columnWrapper}
              contentContainerStyle={mainstorestyles.contentContainer}
            />
          </>
        </View>
      )}
    </ImageBackground>
  );
}

export default StorePage;