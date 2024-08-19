import React from 'react';
import { View, Text, FlatList, TouchableOpacity, GestureResponderEvent, Alert } from 'react-native'; // make sure to install axios or use fetch
import { storepagestyles } from './storestylesheets';
import axiosInstance from '../../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { Product } from '../../app/store';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onRemove: (productId: string) => void;
}

const Cart: React.FC<CartProps> = ({ cart, onRemove }) => {
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={storepagestyles.cartItem}>
      <Text style={storepagestyles.productName}>{item.product.name}</Text>
      <Text style={storepagestyles.productPrice}>
        {item.quantity} x 🪙{item.product.price.toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => onRemove(item.product.id)} style={storepagestyles.removeButton}>
        <Text style={storepagestyles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

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
        await AsyncStorage.removeItem('cartitems'); // Clears the cart
        router.navigate("/"); // Navigates user away from the current page
        Alert.alert("Success", "Checkout successful!");
      })
      .catch(error => {
        Alert.alert("Checkout Failed", error.response?.data.message || "An error occurred during checkout.");
        console.error('Checkout failed', error);
      });
  }


  return (
    <View style={storepagestyles.cartContainer}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id.toString()}
        renderItem={renderItem}
      />
      <Text style={storepagestyles.totalPrice}>Total: {totalPrice} Coins</Text>
      <TouchableOpacity onPress={checkout} style={storepagestyles.checkoutButton}>
        <Text style={storepagestyles.checkoutButtonText}>Checkout All Items</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Cart;
