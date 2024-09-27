import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, GestureResponderEvent, Alert, StyleSheet, useColorScheme } from 'react-native'; // make sure to install axios or use fetch
import axiosInstance from '../../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { Product } from '../../api/store';
import CartPurchaseAnimation from '../Animations/CartPurchaseAnimation';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onRemove: (productId: string) => void;
}

const Cart: React.FC<CartProps> = ({ cart, onRemove }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const styles = getStyles(isDarkMode);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Text style={styles.productName}>{item.product.name}</Text>
      <Text style={styles.productPrice}>
        {item.quantity} x 🪙{item.product.price.toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => onRemove(item.product.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const [showAnimation, setShowAnimation] = useState(false);

  async function checkout(event: GestureResponderEvent): Promise<void> {
    if (cart.length === 0) {
      Alert.alert("Checkout Unavailable", "Your cart is empty.");
      return;
    }

    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      Alert.alert("Authentication Error", "No authentication token found.");
      return;
    }

    // Transform cart items to match backend expectations
    const items = cart.map(cartItem => ({
      product: {
        name: cartItem.product.name,
        category: cartItem.product.type, // Include the category field
      },
      quantity: cartItem.quantity,
    }));

    // Calculate total price based on the cart items
    const totalPrice = cart.reduce((total, cartItem) => total + cartItem.product.price * cartItem.quantity, 0);

    // Sending data in the request body for a POST request
    axiosInstance.post('/api/purchaseItem', {
      token,
      items, // Sending transformed items
      money: totalPrice,
    })
      .then(async response => {
        setShowAnimation(true); // Show the animation
      })
      .catch(error => {
        Alert.alert("Checkout Failed", error.response?.data.message || "An error occurred during checkout.");
        console.error('Checkout failed', error);
      });
  }

  const handleAnimationComplete = async () => {
    setShowAnimation(false);
    await AsyncStorage.removeItem('cartitems');
    router.navigate("/");
    Alert.alert("Success", "Checkout successful!");
  };

  return (
    <View style={styles.cartContainer}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id.toString()}
        renderItem={renderItem}
      />
      <Text style={styles.totalPrice}>Total: {totalPrice} Coins</Text>
      <TouchableOpacity onPress={checkout} style={styles.checkoutButton}>
        <Text style={styles.checkoutButtonText}>Checkout All Items</Text>
      </TouchableOpacity>
      {showAnimation && (
        <CartPurchaseAnimation 
          cartItems={cart} 
          onAnimationComplete={handleAnimationComplete} 
        />
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  cartContainer: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#3D3D3D' : '#E0E0E0',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    color: isDarkMode ? '#FFFFFF' : '#000000',
  },
  productPrice: {
    fontSize: 14,
    color: isDarkMode ? '#B0B0B0' : '#666666',
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    padding: 10,
    color: isDarkMode ? '#FFFFFF' : '#000000',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    margin: 10,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Cart;
