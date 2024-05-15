import React from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';

interface Product {
  id: number;
  name: string;
  price: number;
  image: any; // Update image type to any to support require
}

interface Props {
  product: Product;
  addToCart: (product: Product) => void;
}

const ProductItem: React.FC<Props> = ({ product, addToCart }) => {
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{product.name}</Text>
      <Image source={product.image} style={styles.image} resizeMode="cover" />
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
    image: {
      width: '100%',
      height: 200, // You can adjust the height as needed
      marginVertical: 8,
      borderRadius: 4, // Optional: Add border radius to the image
    },
    price: {
      fontSize: 14,
      color: '#888',
      marginVertical: 4,
    },
  });
  
  export default ProductItem;