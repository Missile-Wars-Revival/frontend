import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { initConnection, requestPurchase } from 'react-native-iap';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  sku: string; // Add SKU to Product interface
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onRemove: (productId: number) => void;
}

const Cart: React.FC<CartProps> = ({ cart, onRemove }) => {
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    const skus = cart.map((item) => item.product.sku); // Array of SKUs from cart

    try {
        // Initialize IAP connection if not already initialized (consider doing this earlier in the app lifecycle)
        const connected = await initConnection();
        if (!connected) {
            console.log('Failed to initialize IAP connection');
            return;
        }

        // Perform the purchase for each SKU in the cart
        await Promise.all(skus.map(async (sku) => {
            console.log("sku is", sku);
            await requestPurchase({
                sku,
                andDangerouslyFinishTransactionAutomaticallyIOS: false,
            });
        }));
        console.log("All purchases successful!");
    } catch (err: any) {
        console.warn("Error occurred during purchase:", err.message);
        console.log(err); // Log full error for better diagnostics
    }
};


  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Text style={styles.productName}>{item.product.name}</Text>
      <Text style={styles.productPrice}>
        {item.quantity} x ${item.product.price.toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => onRemove(item.product.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.cartContainer}>
      <Text></Text>
      <Text></Text>
      <Text></Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id.toString()}
        renderItem={renderItem}
      />
      <Text style={styles.totalPrice}>Total: ${totalPrice.toFixed(2)}</Text>
      <TouchableOpacity onPress={handleCheckout} style={styles.checkoutButton}>
        <Text style={styles.checkoutButtonText}>Checkout All Items</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cartContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cartItem: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 18,
  },
  productPrice: {
    fontSize: 16,
    color: '#888',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  removeButton: {
    backgroundColor: '#ff6347',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
  },
  checkoutButton: {
    backgroundColor: '#007bff',
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Cart;
