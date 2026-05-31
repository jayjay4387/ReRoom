import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Image01Icon from '@hugeicons/core-free-icons/Image01Icon';
import SkyBackground from '../../components/aero/SkyBackground';
import GlassCard from '../../components/aero/GlassCard';
import { GLASS } from '../../constants/theme';

export default function GalleryScreen() {
  return (
    <SkyBackground>
      <View style={styles.center}>
        <GlassCard style={styles.card}>
          <HugeiconsIcon icon={Image01Icon} size={30} color={GLASS.textDark} />
          <Text style={styles.title}>Community gallery</Text>
          <Text style={styles.sub}>Coming soon</Text>
        </GlassCard>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  card: { width: '86%' },
  title: { fontSize: 15, fontWeight: '700', color: GLASS.textDark },
  sub: { fontSize: 12, color: GLASS.textDark, opacity: 0.7 },
});
