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
        color: isDarkMode ? '#E0E0E0' : 'black',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
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

export const getMainMapStyles = (isDarkMode: boolean) => createStyles(isDarkMode);
