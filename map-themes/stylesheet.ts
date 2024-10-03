import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get('window');

export const mapstyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        opacity: 0.6,
        justifyContent: 'center', 
        alignItems: 'center', 
    },
    overlayText: {
        fontSize: 16,
        color: 'black',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    overlaySubText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'grey',
    },
    switchContainer: {
        position: 'absolute',
        top: 50,
        left: 330,
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchText: {
        marginLeft: -110,
        color: 'white',
    },
});


const createStyles = (isDarkMode: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#121212' : '#FFF'
      },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        opacity: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
        color: 'black',
        fontWeight: 'bold',
      },
    overlaySubText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'grey',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    switchContainer: {
        position: 'absolute',
        top: height * 0.07, // 5% from the top
        right: width * 0.05, // 5% from the right
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 5,
    },
    switchText: {
        marginRight: 10,
        color: 'white',
    },
    disabledMap: {
      opacity: 0.5,
    },
    relocateButton: {
      position: 'absolute',
      height: 42,  
      width: 42,   
      right: width * 0.05, // 5% from the right
      bottom: height * 0.05, // 5% from the bottom
      padding: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', 
      borderRadius: 21, 
      alignItems: 'center', 
      justifyContent: 'center', 
  },
});

export const getShopStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
      flex: 1,
    },
    containerDark: {
      flex: 1,
      backgroundColor: '#1E1E1E',
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    titleImage: {
      width: width * 0.8,
      height: height * 0.1,
      resizeMode: 'contain',
      alignSelf: 'center',
      marginTop: height * 0.02,
    },
    shopImage: {
      width: width * 0.7,
      height: height * 0.08,
      resizeMode: 'stretch',
      alignSelf: 'center',
      marginTop: -25,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      marginTop: -15,
      backgroundColor: `transparent`,
    },
    currencyContainer: {
      backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#fff',
      borderRadius: 20,
      padding: 10,
    },
    currencyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    currencyTextDark: {
      color: '#FFF',
    },
    switchContainer: {
      // Add any specific styles for the switch container if needed
    },
    toggleButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
    },
    coinsButton: {
      backgroundColor: '#ffd700',
    },
    premiumButton: {
      backgroundColor: '#4a5568',
    },
    toggleButtonText: {
      fontWeight: 'bold',
      color: '#fff',
    },
    tabContainerMissiles: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 10,
    },
    tabMissiles: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#fff',
    },
    selectedTab: {
      backgroundColor: colorScheme === 'dark' ? '#4CAF50' : '#e0e0e0',
    },
    missileTabText: {
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    selectedTabText: {
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    columnWrapper: {
      justifyContent: 'space-around',
    },
    contentContainer: {
      paddingBottom: 20,
    },
    productButton: {
      backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#fff',
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
      margin: 5,
      width: width * 0.28,
      height: width * 0.4,
      justifyContent: 'space-between',
    },
    productImage: {
      width: width * 0.2,
      height: width * 0.2,
      resizeMode: 'contain',
    },
    productName: {
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 5,
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    productNameDark: {
      color: '#FFF',
    },
    productPrice: {
      fontSize: 12,
      color: colorScheme === 'dark' ? '#B0B0B0' : '#666',
    },
    productPriceDark: {
      color: '#B0B0B0',
    },
    cartButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      alignSelf: 'center',
      marginTop: 10,
    },
    cartButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cartContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#f0f2f5',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: height * 0.8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: 'white',
      borderRadius: 20,
      width: '90%',
      maxHeight: '80%',
      overflow: 'hidden',
    },
    modalContainerDark: {
      backgroundColor: '#2C2C2C',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#444' : '#e0e0e0',
    },
    modalImage: {
      width: 80,
      height: 80,
      marginRight: 15,
    },
    modalTitleContainer: {
      flex: 1,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
      marginBottom: 5,
    },
    modalTitleDark: {
      color: '#FFF',
    },
    modalPrice: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#4CAF50',
    },
    modalPriceDark: {
      color: '#81C784',
    },
    modalContent: {
      padding: 20,
    },
    modalDescription: {
      fontSize: 16,
      color: '#333',
      marginBottom: 15,
    },
    modalDescriptionDark: {
      color: '#B0B0B0',
    },
    modalStatsContainer: {
      backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#f5f5f5',
      borderRadius: 10,
      padding: 15,
    },
    modalText: {
      fontSize: 16,
      marginBottom: 10,
      color: '#333',
    },
    modalTextDark: {
      color: '#E0E0E0',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalViewDark: {
      backgroundColor: '#333',
    },
    button: {
      borderRadius: 20,
      padding: 10,
      elevation: 2,
    },
    buttonClose: {
      backgroundColor: '#2196F3',
    },
    textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    modalTextProminent: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#000', // Adjust color as needed
    },
    modalTextProminentDark: {
      color: '#fff', // Adjust color for dark mode
    },
    lessImportantDetails: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
    },
    modalTextSecondary: {
      fontSize: 14,
      color: '#666', // Adjust color as needed
      marginBottom: 5,
    },
    modalTextSecondaryDark: {
      color: '#aaa', // Adjust color for dark mode
    },
    closeButton: {
      backgroundColor: '#e74c3c', // A red color, you can change this
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      alignSelf: 'center',
      marginTop: 20,
    },
  
    closeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    tabletProductButton: {
      width: '18%',
      aspectRatio: 0.75,
      margin: '1%',
      backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#fff',
      borderRadius: 15,
      padding: 15,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tabletProductImage: {
      width: '80%',
      height: '60%',
      resizeMode: 'contain',
    },
    tabletProductName: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 10,
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    tabletProductPrice: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#B0B0B0' : '#666',
      marginTop: 5,
    },
    tabletContentContainer: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    tabletColumnWrapper: {
      justifyContent: 'space-around',
    },
    tabletHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      marginTop: -15,
      backgroundColor: 'transparent',
    },
    tabletCurrencyContainer: {
      backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#fff',
      borderRadius: 25,
      padding: 15,
    },
    tabletCurrencyText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFF' : '#000',
    },
    tabletToggleButton: {
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 25,
    },
    tabletToggleButtonText: {
      fontWeight: 'bold',
      color: '#fff',
      fontSize: 18,
    },
    tabletTabContainerMissiles: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 20,
    },
    tabletTabMissiles: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
      backgroundColor: colorScheme === 'dark' ? '#3D3D3D' : '#fff',
    },
    tabletMissileTabText: {
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFF' : '#000',
      fontSize: 16,
    },
    tabletCartButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 10,
      alignSelf: 'center',
      marginTop: 20,
    },
    tabletCartButtonText: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: 'bold',
    },
  });

export const Layout_styles = StyleSheet.create({
    navBar: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#f0f2f5',
      height: 100,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    navBarDark: {
      backgroundColor: '#1E1E1E',
      borderTopColor: '#3D3D3D',
    },
    tabButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 5,
    },
    iconContainerDark: {
      backgroundColor: '#2C2C2C',
    },
    selectedIconContainer: {
      backgroundColor: '#e6f7ff',
    },
    selectedIconContainerDark: {
      backgroundColor: '#3D3D3D',
    },
    tabText: {
      color: '#666',
      fontSize: 12,
    },
    tabTextDark: {
      color: '#B0B0B0',
    },
    selectedTabText: {
      color: 'blue',
    },
    selectedTabTextDark: {
      color: '#4CAF50',
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: 'red',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
    },
    countdownContainer: {
      position: 'absolute',
      bottom: 90,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 1000,
    },
  });

export const getMainMapStyles = (isDarkMode: boolean) => createStyles(isDarkMode);
