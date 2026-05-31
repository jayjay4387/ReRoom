import { ComponentProps } from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CTA_GREEN, GLASS } from '../../constants/theme';

type IconType = ComponentProps<typeof HugeiconsIcon>['icon'];

type Props = {
  label: string;
  icon?: IconType;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const GLOSS_OVERLAY = ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)'] as const;

export function GlassButtonPrimary({ label, icon, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryWrap, style, pressed && styles.pressed]}>
      <View style={styles.clip}>
        <LinearGradient colors={CTA_GREEN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          <LinearGradient colors={GLOSS_OVERLAY} style={styles.gloss} pointerEvents="none" />
          {icon && <HugeiconsIcon icon={icon} size={18} color="#ffffff" />}
          <Text style={styles.primaryText}>{label}</Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export function GlassButtonGhost({ label, icon, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostWrap, style, pressed && styles.pressed]}>
      <View style={[styles.clip, styles.ghostBorder]}>
        <BlurView intensity={24} tint="light" style={[styles.fill, styles.ghostFill]}>
          {icon && <HugeiconsIcon icon={icon} size={16} color={GLASS.textDark} />}
          <Text style={styles.ghostText}>{label}</Text>
        </BlurView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    width: '86%',
    alignSelf: 'center',
    borderRadius: 999,
    shadowColor: '#145A1E',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ghostWrap: { width: '86%', alignSelf: 'center', borderRadius: 999 },
  clip: { borderRadius: 999, overflow: 'hidden' },
  fill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ghostBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)' },
  ghostFill: { backgroundColor: 'rgba(255,255,255,0.32)' },
  ghostText: { color: GLASS.textDark, fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.9 },
});
