import { ComponentProps } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import Camera01Icon from '@hugeicons/core-free-icons/Camera01Icon';
import Image01Icon from '@hugeicons/core-free-icons/Image01Icon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon';
import SkyBackground from '../components/aero/SkyBackground';
import { GlassButtonPrimary, GlassButtonGhost } from '../components/aero/GlassButton';
import { useRoom } from '../context/RoomContext';
import { GLASS, CTA_GREEN } from '../constants/theme';

type IconType = ComponentProps<typeof HugeiconsIcon>['icon'];

function ActionCard({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: IconType;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}>
      <BlurView intensity={28} tint="light" style={styles.actionCard}>
        {accent ? (
          <LinearGradient colors={CTA_GREEN} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubble}>
            <HugeiconsIcon icon={icon} size={30} color="#ffffff" />
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleNeutral]}>
            <HugeiconsIcon icon={icon} size={30} color={GLASS.textDark} />
          </View>
        )}
        <Text style={styles.actionLabel}>{label}</Text>
      </BlurView>
    </Pressable>
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const { photo, setPhoto } = useRoom();

  const pickFrom = async (mode: 'camera' | 'library') => {
    try {
      const perm =
        mode === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', `Please allow ${mode === 'camera' ? 'camera' : 'photo'} access in Settings.`);
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 1 };
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.back })
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (!result.canceled) setPhoto(result.assets[0]);
    } catch {
      Alert.alert('Something went wrong', 'Could not open that. Please try again.');
    }
  };

  return (
    <SkyBackground>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={GLASS.textDark} />
        </Pressable>
        <Text style={styles.htitle}>{photo ? 'Looks good?' : 'Scan your room'}</Text>
      </View>

      <View style={styles.body}>
        {photo ? (
          <>
            <View style={styles.frame}>
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            </View>
            <View style={styles.btns}>
              <GlassButtonPrimary label="Looks good" icon={CheckmarkCircle01Icon} onPress={() => router.push('/style')} />
              <GlassButtonGhost label="Retake" icon={RefreshIcon} onPress={() => setPhoto(null)} />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.prompt}>Point at the room you want to redesign</Text>
            <View style={styles.cardsRow}>
              <ActionCard icon={Camera01Icon} label="Take Photo" accent onPress={() => pickFrom('camera')} />
              <ActionCard icon={Image01Icon} label="Choose from gallery" onPress={() => pickFrom('library')} />
            </View>
          </View>
        )}
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 54, paddingHorizontal: 14, paddingBottom: 6 },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  htitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 36 },

  // empty state — two big action cards centered
  empty: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', gap: 20, paddingTop: 16 },
  prompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(20,80,140,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardsRow: { flexDirection: 'row', gap: 14, width: '100%' },
  cardWrap: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#143C5A',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  pressed: { opacity: 0.9 },
  actionCard: {
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: GLASS.fill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 10,
  },
  bubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145A1E',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bubbleNeutral: { backgroundColor: 'rgba(255,255,255,0.55)', shadowColor: '#143C5A', shadowOpacity: 0.18 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: GLASS.textDark, textAlign: 'center' },

  // preview state
  frame: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  photo: { width: '100%', height: '100%' },
  btns: { marginTop: 'auto', alignItems: 'center', gap: 10 },
});
