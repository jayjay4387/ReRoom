import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-4xl font-bold mb-2">ReRoom</Text>
      <Text className="text-gray-400 text-base mb-12">Point. Redesign. Watch it happen.</Text>
      <Pressable
        className="bg-white px-8 py-4 rounded-full"
        onPress={() => router.push('/scan')}
      >
        <Text className="text-black font-semibold text-base">Scan Your Room</Text>
      </Pressable>
    </View>
  );
}
