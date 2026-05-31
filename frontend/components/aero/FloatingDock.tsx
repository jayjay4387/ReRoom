import { View, Pressable, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, Image01Icon } from '@hugeicons/core-free-icons';
import { CTA_GREEN, GREEN_TEXT } from '../../constants/theme';

const ICONS: Record<string, typeof Home01Icon> = { index: Home01Icon, gallery: Image01Icon };
const LABELS: Record<string, string> = { index: 'Home', gallery: 'Gallery' };

export default function FloatingDock({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <BlurView intensity={30} tint="light" style={styles.dock}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const icon = ICONS[route.name] ?? Home01Icon;
          const label = LABELS[route.name] ?? route.name;

          if (focused) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <LinearGradient colors={CTA_GREEN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
                  <HugeiconsIcon icon={icon} size={16} color="#ffffff" />
                  <Text style={styles.onText}>{label}</Text>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <View style={styles.pill}>
                <HugeiconsIcon icon={icon} size={16} color={GREEN_TEXT} />
                <Text style={styles.offText}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, bottom: 18 },
  dock: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tab: { flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 13 },
  onText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  offText: { color: GREEN_TEXT, fontWeight: '600', fontSize: 11 },
});
