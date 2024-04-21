import { Stack } from "expo-router";
import React = require("react");
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="Map" />
      </Stack>
    </SafeAreaProvider>
  );
}
