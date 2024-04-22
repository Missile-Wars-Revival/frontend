import { Text, SafeAreaView } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Text className="text-2xl text-green-700">Index</Text>
      <Link href="/login" className="text-blue-500">
        Login Page
      </Link>
    </SafeAreaView>
  );
}
