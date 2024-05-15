import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Props {
  cart: Product[];
}

const Cart: React.FC<Props> = ({ cart }) => {
  const total = cart.reduce((sum, product) => sum + product.price, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Shopping Cart</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            <Text>${item.price.toFixed(2)}</Text>
          </View>
        )}
      />
      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
});

export default Cart;
