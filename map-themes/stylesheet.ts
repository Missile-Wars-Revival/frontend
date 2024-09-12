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
  });

export const getMainMapStyles = (isDarkMode: boolean) => createStyles(isDarkMode);
