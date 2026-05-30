import { View, Image, Text } from 'react-native';

type Props = {
  frame1: string;
  frame2: string;
  frame3: string;
};

export default function StoryboardStrip({ frame1, frame2, frame3 }: Props) {
  return (
    <View className="flex-row items-center px-4 pt-8 gap-2">
      {[frame1, frame2, frame3].map((uri, i) => (
        <View key={i} className="flex-row items-center flex-1">
          <Image source={{ uri }} className="flex-1 h-24 rounded-lg" resizeMode="cover" />
          {i < 2 && <Text className="text-white text-xl px-1">→</Text>}
        </View>
      ))}
    </View>
  );
}
