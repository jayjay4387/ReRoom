import { View, Text, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useRoom } from '../context/RoomContext';
import ProgressSteps from '../components/ProgressSteps';

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

  useEffect(() => {
    run();
  }, []);

  const run = async () => {
    try {
      setStep(1);
      const framesRes = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photo?.base64, style }),
      });
      if (!framesRes.ok) throw new Error(`generate-frames ${framesRes.status}`);
      const frames = await framesRes.json();

      setStep(2);
      setChaosPreview(frames.chaosFrame);
      setChaosFrame(frames.chaosFrame);

      setStep(3);
      setFinalPreview(frames.finalFrame);
      setFinalFrame(frames.finalFrame);
      setDescription(frames.description);

      setStep(4);
      const videoRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame1Base64: photo?.base64,
          frame2Base64: frames.chaosFrame,
          frame3Base64: frames.finalFrame,
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
    throw new Error('Timed out after 120 seconds');
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
          <Image source={{ uri: `data:image/jpeg;base64,${chaosPreview}` }} className="flex-1 h-32 rounded-xl" resizeMode="cover" />
        )}
        {finalPreview && (
          <Image source={{ uri: `data:image/jpeg;base64,${finalPreview}` }} className="flex-1 h-32 rounded-xl" resizeMode="cover" />
        )}
      </View>
    </View>
  );
}
