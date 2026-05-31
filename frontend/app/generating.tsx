import { View, Text, Image, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon';
import SkyBackground from '../components/aero/SkyBackground';
import { GlassButtonGhost } from '../components/aero/GlassButton';
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
  const { photo, style, setChaosFrame, setFinalFrame, setVideoUrl, setDescription } = useRoom();
  const [step, setStep] = useState(0);
  const [chaosPreview, setChaosPreview] = useState<string | null>(null);
  const [finalPreview, setFinalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { run(); }, []);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const run = async () => {
    try {
      // Step 1: brief "analyzing" moment so the indicator is visible before the request fires
      setStep(1);
      await sleep(600);

      // Step 2: show "Creating the chaos..." while the frames request is in-flight
      setStep(2);
      const framesRes = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photo?.base64, style }),
      });
      if (!framesRes.ok) throw new Error(`generate-frames ${framesRes.status}`);
      const frames = await framesRes.json();

      // Chaos thumbnail appears first — let it render before the final frame
      setChaosPreview(frames.chaosFrame);
      setChaosFrame(frames.chaosFrame);

      // Step 3: "Designing your new space..." — brief pause so chaos thumbnail is seen alone
      setStep(3);
      await sleep(500);

      setFinalPreview(frames.finalFrame);
      setFinalFrame(frames.finalFrame);
      setDescription(frames.description);
      await sleep(300);

      // Step 4: "Rendering your transformation..." — submit video job and poll
      setStep(4);
      const videoRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startFrameBase64: photo?.base64,
          endFrameBase64: frames.finalFrame,
        }),
      });
      if (!videoRes.ok) throw new Error(`generate-video ${videoRes.status}`);
      const { jobId } = await videoRes.json();

      const videoUrl = await pollVideo(jobId);
      setVideoUrl(videoUrl);
      router.push('/result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const pollVideo = async (jobId: string): Promise<string> => {
    const start = Date.now();
    while (Date.now() - start < 120_000) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/generate-video?jobId=${jobId}`);
      const data = await res.json();
      if (data.status === 'complete') return data.videoUrl;
      if (data.status === 'error') throw new Error('Video generation failed');
    }
    throw new Error('This is taking longer than expected');
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
                onPress={() => { setError(null); setStep(0); setChaosPreview(null); setFinalPreview(null); run(); }}
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

        {/* Frame thumbnails — fade in as each arrives */}
        {(chaosPreview || finalPreview) && (
          <View style={styles.thumbRow}>
            {chaosPreview && (
              <View style={styles.thumbFrame}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${chaosPreview}` }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              </View>
            )}
            {finalPreview && (
              <View style={styles.thumbFrame}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${finalPreview}` }}
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
