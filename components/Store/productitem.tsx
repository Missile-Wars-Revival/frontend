import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Props {
  product: Product;
  addToCart: (product: Product) => void;
}

const ProductItem: React.FC<Props> = ({ product, addToCart }) => {
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      <Button title="Add to Cart" onPress={() => addToCart(product)} />
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
  },
});

export default ProductItem;
