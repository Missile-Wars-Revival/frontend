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
      //fontFamily: 'NotoSansRegular', Need Import!!
      color: '#753663',
      borderColor: '#FFF',
      fontSize: 30,
      fontWeight: 'bold',
      textAlign: 'center',
      justifyContent: 'center',
      marginRight: 15,
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
  
  export const mainstorestyles = StyleSheet.create({ //Styles made by NightSpark 
    container: {
      flex: 1,
      backgroundColor: '#F3F6EC',
      padding: 16,
      justifyContent: 'center',
    },
    backgroundImage: {
      flex: 1,
      marginTop: -30, // Fills the whole top part of the screen
      resizeMode: 'cover',
    },
    titleImage: {
      width: 350,
      height: 100,
      position: 'absolute',
      top: 70,
      left: 37,
    },
    shopImage: {
      width: 110,
      height: 80,
      top: 120,
      left: 160,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // Centers the currency container
      marginHorizontal: 20,
      marginVertical: 10,
      marginTop: 105,
    },
    currencyContainer: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginLeft: 205,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      color: '#753663',
    },
    tabContainerMissiles: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      marginLeft: 6,
    },
    tabMissiles: {
      width: 100,
      height: 40,
      backgroundColor: '#753663',
      padding: 10,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7, // Space between
    },
    missileTabText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      //fontFamily: 'Noto Sans Regular', // Need to import!!
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    contentContainer: {
      alignItems: 'center',
    },
    button: {
      width: 110,
      height: 110,
      margin: 11,
      backgroundColor: '#DDD5F3',
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: '#7B5370',
      borderWidth: 1,
      borderRadius: 26,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 5 },
      shadowOpacity: 0.8,
      shadowRadius: 3,
      elevation: 5, // for Android
    },
    buttonImage: {
      width: '50%',
      height: '70%',
      resizeMode: 'cover',
    },
    buttonText: {
      color: '#753663',
      borderColor: '#FFF',
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: -5,
      marginBottom: -5,
    },
    cartButton: {
      backgroundColor: '#753663',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      marginVertical: 10,
    },
    cartButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    toggleButton: {
      width: 100,
      height: 40,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 61,
    },
    coinsButton: {
      backgroundColor: '#DDD5F3',
    },
    premiumButton: {
      backgroundColor: '#5a2b5f',
    },
    toggleButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });