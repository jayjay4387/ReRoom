import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Camera01Icon from '@hugeicons/core-free-icons/Camera01Icon';
import SkyBackground from '../../components/aero/SkyBackground';
import GlassCard from '../../components/aero/GlassCard';
import GlassHouse from '../../components/aero/GlassHouse';
import { GlassButtonPrimary } from '../../components/aero/GlassButton';
import { WORDMARK_GRADIENT, GLASS } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <SkyBackground>
      <View style={styles.container}>
        <GlassHouse />
        <MaskedView maskElement={<Text style={styles.brand}>ReRoom</Text>}>
          <LinearGradient colors={WORDMARK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            <Text style={[styles.brand, styles.brandHidden]}>ReRoom</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.tag}>Point. Redesign. Watch it happen.</Text>
        <GlassCard style={styles.card}>
          <HugeiconsIcon icon={Camera01Icon} size={26} color={GLASS.textDark} />
          <Text style={styles.lead}>Scan a room to begin</Text>
        </GlassCard>
        <View style={styles.spacer} />
        <GlassButtonPrimary label="Scan Your Room" icon={Camera01Icon} onPress={() => router.push('/scan')} />
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 72, paddingHorizontal: 20, paddingBottom: 110 },
  brand: { fontSize: 40, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', color: '#000000' },
  brandHidden: { opacity: 0 },
  tag: { marginTop: 4, fontSize: 13, textAlign: 'center', color: '#EEF8FF' },
  card: { width: '100%', marginTop: 24 },
  lead: { fontSize: 12, color: GLASS.textDark, opacity: 0.85 },
  spacer: { flex: 1 },
});
