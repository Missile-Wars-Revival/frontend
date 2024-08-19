import { StyleSheet } from "react-native";

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
export const mainmapstyles = StyleSheet.create({
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
        backgroundColor: '#FFF' // You can adjust the background color as needed
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
    relocateButton: {
        flex: 0,
        position: 'absolute',
        height: 42,  // Button height
        width: 42,   // Button width, assuming a square shape for aesthetic consistency
        right: 10,
        bottom: 15,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        borderRadius: 21, // Half of height or width to make it perfectly circular
        alignItems: 'center', // Center the icon horizontally
        justifyContent: 'center', // Center the icon vertically
    },
});
