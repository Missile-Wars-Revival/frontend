import React from "react";
import { Text, SafeAreaView, StyleSheet } from "react-native";
import MapView from "react-native-maps";

export default function Map() {
  return (
    <SafeAreaView style={styles.container}> 
      <Text style={styles.header}>Map Page</Text> 
      <MapView
        provider={MapView.PROVIDER_GOOGLE} // Use Google Maps API key can be foud in app.json
        style={styles.map}
        initialRegion={{
          latitude: 37.78825, // Example latitude
          longitude: -122.4324, // Example longitude
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        //player data is handled later on - this is just temp map
      >
        {/* You can add markers, polygons, etc. here */}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { //Heading style
    fontSize: 24,
    color: 'green',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
});
