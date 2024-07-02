import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Product } from '../../app/store';
import { storepagestyles } from './storestylesheets';
import { GameItem } from 'middle-earth';


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
        {item.quantity} x ⭐{item.product.price.toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => onRemove(item.product.id)} style={storepagestyles.removeButton}>
        <Text style={storepagestyles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  function checkout(event: GestureResponderEvent): void {
    console.log("Checkout implementation needed (backend work)!!!");
  }

  return (
    <View style={storepagestyles.cartContainer}>
      <Text></Text>
      <Text></Text>
      <Text></Text>
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
