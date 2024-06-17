import { StyleSheet } from "react-native";


export const storepagestyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f8f8',
      padding: 16,
    },
    list: {
      alignItems: 'center',
    },
    categoryContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    categoryButton: {
      marginHorizontal: 10,
      padding: 10,
      backgroundColor: '#ddd',
      borderRadius: 5,
    },
    currencyText: {
      alignSelf: 'flex-end',
      margin: 0.1,
    },
    //cart:
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
      //items 
      itemContainer: {
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        backfaceVisibility: 'hidden',
      },
      name: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      image: {
        width: '100%',
        height: 200,
        marginVertical: 8,
        borderRadius: 4,
      },
      price: {
        fontSize: 14,
        color: '#888',
        marginVertical: 4,
      },
  });
  