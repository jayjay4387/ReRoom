import { View, Image, Text } from 'react-native';

type Props = {
  frames: string[]; // shown left→right with arrows between (e.g. [original, redesign])
};

export default function StoryboardStrip({ frames }: Props) {
  return (
    <View className="flex-row items-center px-4 pt-8 gap-2">
      {frames.map((uri, i) => (
        <View key={i} className="flex-row items-center flex-1">
          <Image source={{ uri }} className="flex-1 h-24 rounded-lg" resizeMode="cover" />
          {i < frames.length - 1 && <Text className="text-white text-xl px-1">→</Text>}
        </View>
      ))}
    </View>
  );
}
