import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Sharing from 'expo-sharing';
import { useRoom } from '../context/RoomContext';
import StoryboardStrip from '../components/StoryboardStrip';

export default function ResultScreen() {
  const router = useRouter();
  const { photo, finalFrame, videoUrl, description, reset } = useRoom();

  const player = useVideoPlayer(videoUrl ?? '', (p) => {
    p.loop = true;
    p.play();
  });

  const share = async () => {
    if (videoUrl && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(videoUrl);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ paddingBottom: 40 }}>
      <StoryboardStrip
        frames={[photo?.uri, finalFrame].filter((u): u is string => !!u)}
      />
      {videoUrl && (
        <VideoView
          player={player}
          style={{ width: '100%', height: 360, marginTop: 16, backgroundColor: '#000' }}
          contentFit="contain"
          nativeControls
        />
      )}
      {description && (
        <Text className="text-gray-300 text-sm px-6 mt-4 leading-relaxed">{description}</Text>
      )}
      <View className="px-6 mt-8 gap-4">
        <Pressable className="bg-white py-4 rounded-full" onPress={share}>
          <Text className="text-black font-semibold text-center">Share</Text>
        </Pressable>
        <Pressable
          className="border border-gray-600 py-4 rounded-full"
          onPress={() => { reset(); router.push('/scan'); }}
        >
          <Text className="text-gray-300 text-center">Try Another Room</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
