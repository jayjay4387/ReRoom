import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RoomProvider } from '../context/RoomContext';

export default function RootLayout() {
  return (
    <RoomProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="style" />
        <Stack.Screen name="generating" />
        <Stack.Screen name="result" />
      </Stack>
    </RoomProvider>
  );
}
