import { View, Text, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useRoom } from '../context/RoomContext';
import { apiUrl } from '../lib/api';
import { saveRedesign } from '../lib/redesigns';
import ProgressSteps from '../components/ProgressSteps';

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

  useEffect(() => {
    run();
  }, []);

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

      // Backend returns 4 candidates per frame (Cloudinary URLs) + the hosted original.
      // Take the first candidate for now — no in-app chooser yet.
      const originalUrl: string | undefined = frames.originalUrl;
      const chaosUrl: string | undefined = frames.chaosFrameCandidates?.[0];
      const finalUrl: string | undefined = frames.finalFrameCandidates?.[0];
      if (!originalUrl || !finalUrl) throw new Error('generate-frames returned no usable frames');

      setStep(2);
      if (chaosUrl) {
        setChaosPreview(chaosUrl);
        setChaosFrame(chaosUrl);
      }

      setStep(3);
      setFinalPreview(finalUrl);
      setFinalFrame(finalUrl);
      setOriginalUrl(originalUrl);
      setDescription(frames.description ?? '');

      setStep(4);
      // Higgsfield Kling 3.0 animates the original room (cluttered -> organized) from one image.
      // This call blocks until the video is rendered (the backend polls Higgsfield).
      const videoRes = await fetch(apiUrl('/api/generate-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: originalUrl }),
      });
      if (!videoRes.ok) throw new Error(`generate-video ${videoRes.status}`);
      const { videoUrl } = await videoRes.json();
      setVideoUrl(videoUrl);

      // Persist to the gallery — non-blocking: the user still sees their result if this fails.
      saveRedesign({ originalUrl, chaosUrl, finalUrl, videoUrl, style, description: frames.description ?? '' })
        .catch((err) => console.warn('[save-redesign] failed (non-blocking):', err));

      router.push('/result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-lg text-center mb-4">{error}</Text>
        <Text className="text-gray-400 text-sm text-center">Please try again</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-6 pt-16">
      <ProgressSteps steps={STEPS} current={step} />
      <View className="flex-row mt-10 gap-3">
        {chaosPreview && (
          <Image source={{ uri: chaosPreview }} className="flex-1 h-32 rounded-xl" resizeMode="cover" />
        )}
        {finalPreview && (
          <Image source={{ uri: finalPreview }} className="flex-1 h-32 rounded-xl" resizeMode="cover" />
        )}
      </View>
    </View>
  );
}
