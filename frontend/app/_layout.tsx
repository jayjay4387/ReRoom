import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RoomProvider } from '../context/RoomContext';

export default function RootLayout() {
  return (
    <RoomProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
        }}
      />
    </RoomProvider>
  );
}
