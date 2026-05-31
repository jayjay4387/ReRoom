import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Camera01Icon from '@hugeicons/core-free-icons/Camera01Icon';
import SkyBackground from '../../components/aero/SkyBackground';
import GlassHouse from '../../components/aero/GlassHouse';
import { GlassButtonPrimary } from '../../components/aero/GlassButton';
import { WORDMARK_GRADIENT } from '../../constants/theme';

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
        <View style={styles.coverFrame}>
          <Image
            source={require('../../assets/images/cover-image-reroom.png')}
            style={styles.cover}
            resizeMode="cover"
          />
        </View>
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
  coverFrame: {
    flex: 1,
    width: '100%',
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  cover: { width: '100%', height: '100%' },
});
