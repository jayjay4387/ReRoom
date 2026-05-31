import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import Camera01Icon from '@hugeicons/core-free-icons/Camera01Icon';
import Image01Icon from '@hugeicons/core-free-icons/Image01Icon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import RefreshIcon from '@hugeicons/core-free-icons/RefreshIcon';
import SkyBackground from '../components/aero/SkyBackground';
import GlassCard from '../components/aero/GlassCard';
import { GlassButtonPrimary, GlassButtonGhost } from '../components/aero/GlassButton';
import { useRoom } from '../context/RoomContext';
import { GLASS } from '../constants/theme';

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
          <>
            <GlassCard style={styles.vf}>
              <HugeiconsIcon icon={Camera01Icon} size={32} color={GLASS.textDark} />
              <Text style={styles.vtext}>Point at the room you want to redesign</Text>
            </GlassCard>
            <View style={styles.btns}>
              <GlassButtonPrimary label="Take Photo" icon={Camera01Icon} onPress={() => pickFrom('camera')} />
              <GlassButtonGhost label="Choose from gallery" icon={Image01Icon} onPress={() => pickFrom('library')} />
            </View>
          </>
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
  vf: { width: '100%', height: 160 },
  vtext: { fontSize: 11, color: GLASS.textDark, opacity: 0.85, textAlign: 'center', paddingHorizontal: 18 },
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
