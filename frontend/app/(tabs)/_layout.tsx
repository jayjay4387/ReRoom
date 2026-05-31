import { Tabs } from 'expo-router';
import FloatingDock from '../../components/aero/FloatingDock';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingDock {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="gallery" />
    </Tabs>
  );
}
