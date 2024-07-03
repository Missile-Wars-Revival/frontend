import React from 'react';
import { View, Text, FlatList, TouchableOpacity, GestureResponderEvent, Alert } from 'react-native'; // make sure to install axios or use fetch
import { storepagestyles } from './storestylesheets';
import { GameItem } from 'middle-earth';
import axiosInstance from '../../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";

interface CartItem {
  product: GameItem;
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
      return; // Stop the function if the cart is empty
    }

    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.log("Authentication Error", "No authentication token found.");
      return;
    }

    const response = await axiosInstance.get('/api/getMoney', {
      params: { token, items: cart, money: totalPrice } 
    })
    .then(async response => {
      await AsyncStorage.removeItem('cartitems');//clears cart
      router.navigate("/");//takes user away
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
