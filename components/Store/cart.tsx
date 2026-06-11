import React from 'react';
import { View, Text, FlatList, GestureResponderEvent, Alert, StyleSheet, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import axiosInstance from '../../api/axios-instance';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { Product } from '../../api/store';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useOnboarding } from '../../util/Context/onboardingContext';
import { getPalette, Gradients, Spacing, Radius, type ThemePalette } from '../ui/theme';
import { PressableScale } from '../ui/PressableScale';
import { haptics } from '../ui/haptics';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onRemove: (productId: string) => void;
  onCheckoutComplete: () => void;
}

const Cart: React.FC<CartProps> = ({ cart, onRemove, onCheckoutComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getStyles(palette);
  const { currentStep, moveToNextStep } = useOnboarding();

  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageWrap}>
        <Image
          source={item.product.image}
          style={styles.itemImage}
          placeholder={require('../../assets/logo.png')}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.product.name}</Text>
        <Text style={styles.productPrice}>
          {item.quantity} × 🪙 {item.product.price}
        </Text>
      </View>
      <Text style={styles.lineTotal}>🪙 {item.product.price * item.quantity}</Text>
      <PressableScale haptic="heavy" onPress={() => onRemove(item.product.id)} style={styles.removeButton}>
        <Ionicons name="trash-outline" size={18} color="#FF4D67" />
      </PressableScale>
    </View>
  );

  async function checkout(event: GestureResponderEvent): Promise<void> {
    if (cart.length === 0) {
      haptics.warning();
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
        await AsyncStorage.removeItem('cartitems');
        // Parent clears the cart, closes the sheet, refreshes the coin
        // balance, and plays the purchase celebration once the sheet is gone.
        onCheckoutComplete();
        if (currentStep === 'checkout') {
          moveToNextStep();
          router.navigate("/");
        }
      })
      .catch(error => {
        haptics.error();
        Alert.alert("Checkout Failed", error.response?.data.message || "An error occurred during checkout.");
        console.error('Checkout failed', error);
      });
  }

  return (
    <View style={styles.cartContainer}>
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={44} color={palette.textFaint} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add weapons and gear from the store.</Text>
        </View>
      ) : (
        <FlatList
          style={styles.cartList}
          data={cart}
          keyExtractor={(item) => item.product.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>🪙 {totalPrice}</Text>
        </View>
        <PressableScale haptic="tap" onPress={checkout}>
          <LinearGradient colors={Gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkoutButton}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.checkoutButtonText}>Checkout All Items</Text>
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
};

const getStyles = (palette: ThemePalette) => StyleSheet.create({
  cartContainer: {
    flex: 1,
    minHeight: 0,
    backgroundColor: palette.surface,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.lg,
    // No safe-area inset here: the tab bar is hidden under the cart sheet.
    paddingBottom: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  cartList: {
    flex: 1,
    minHeight: 0,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    gap: Spacing.md,
  },
  itemImageWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 34,
    height: 34,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  productPrice: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 77, 103, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: palette.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textMuted,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default Cart;
