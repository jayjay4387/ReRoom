import { View, Text, Image, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon';
import SkyBackground from '../components/aero/SkyBackground';
import { GlassButtonGhost } from '../components/aero/GlassButton';
import { apiUrl } from '../lib/api';
import { saveRedesign } from '../lib/redesigns';
import ProgressSteps from '../components/ProgressSteps';
import { useRoom } from '../context/RoomContext';
import { GLASS } from '../constants/theme';

const STEPS = [
  'Analyzing your room...',
  'Creating the chaos...',
  'Designing your new space...',
  'Rendering your transformation...',
];

export default function GeneratingScreen() {
  const router = useRouter();
  const { photo, style, setChaosFrame, setFinalFrame, setOriginalUrl, setVideoUrl, setDescription } = useRoom();
  const [step, setStep] = useState(0);
  const [chaosPreview, setChaosPreview] = useState<string | null>(null);
  const [finalPreview, setFinalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { run(); }, []);

  const run = async () => {
    try {
      setStep(1);
      const framesRes = await fetch(apiUrl('/api/generate-frames'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo?.base64,
          answers: { vibe: style, usage: '', color: '', material: '', transformationLevel: 'full' },
        }),
      });
      if (!framesRes.ok) throw new Error(`generate-frames ${framesRes.status}`);
      const frames = await framesRes.json();

      // Backend returns { originalUrl, redesignUrl, description }
      const originalUrl: string | undefined = frames.originalUrl;
      const finalUrl: string | undefined = frames.redesignUrl;
      if (!originalUrl || !finalUrl) throw new Error('generate-frames returned no usable frames');

      setStep(2);
      setStep(3);
      setFinalPreview(finalUrl);
      setFinalFrame(finalUrl);
      setOriginalUrl(originalUrl);
      setDescription(frames.description ?? '');

      setStep(4);
      // Kling 3.0: original photo as start frame, Gemini redesign as end frame.
      const videoRes = await fetch(apiUrl('/api/generate-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startFrameUrl: originalUrl, endFrameUrl: finalUrl }),
      });
      if (!videoRes.ok) throw new Error(`generate-video ${videoRes.status}`);
      const { videoUrl } = await videoRes.json();
      setVideoUrl(videoUrl);

      // Persist to the gallery — non-blocking: the user still sees their result if this fails.
      saveRedesign({ originalUrl, finalUrl, videoUrl, style, description: frames.description ?? '' })
        .catch((err) => console.warn('[save-redesign] failed (non-blocking):', err));

      router.push('/result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (error) {
    return (
      <SkyBackground>
        <View style={styles.center}>
          <View style={styles.errorShadow}>
            <BlurView intensity={28} tint="light" style={styles.errorCard}>
              <HugeiconsIcon icon={Alert01Icon} size={36} color="#CC2200" />
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorBody}>{error}</Text>
              <GlassButtonGhost
                label="Try again"
                onPress={() => { setError(null); setStep(0); run(); }}
                style={styles.retryBtn}
              />
            </BlurView>
          </View>
        </View>
      </SkyBackground>
    );
  }

  return (
    <SkyBackground>
      <View style={styles.center}>
        {/* Main progress card */}
        <View style={styles.cardShadow}>
          <BlurView intensity={28} tint="light" style={styles.card}>
            <Text style={styles.cardTitle}>Transforming your room</Text>
            <Text style={styles.cardSubtitle}>This takes about a minute — hang tight</Text>
            <View style={styles.divider} />
            <ProgressSteps steps={STEPS} current={step} />
          </BlurView>
        </View>

        {/* Frame thumbnails — fade in as each arrives (Cloudinary URLs) */}
        {(chaosPreview || finalPreview) && (
          <View style={styles.thumbRow}>
            {chaosPreview && (
              <View style={styles.thumbFrame}>
                <Image
                  source={{ uri: chaosPreview }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              </View>
            )}
            {finalPreview && (
              <View style={styles.thumbFrame}>
                <Image
                  source={{ uri: finalPreview }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        )}
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  // progress card
  cardShadow: {
    width: '100%',
    borderRadius: 22,
    shadowColor: '#143C5A',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: GLASS.border,
    backgroundColor: GLASS.fill,
    padding: 22,
    gap: 4,
  },
  cardTitle: {
    color: GLASS.textDark,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: 'rgba(15,59,85,0.55)',
    fontSize: 12,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(180,230,255,0.5)',
    marginVertical: 14,
  },

  // frame thumbnails
  thumbRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  thumbFrame: {
    flex: 1,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#143C5A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  thumb: { width: '100%', height: '100%' },

  // error card
  errorShadow: {
    width: '100%',
    borderRadius: 22,
    shadowColor: '#CC2200',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  errorCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: GLASS.border,
    backgroundColor: GLASS.fill,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    color: GLASS.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  errorBody: {
    color: 'rgba(15,59,85,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: { width: '80%' },
});
