import { Pressable, Text, View } from 'react-native';
import { StyleOption } from '../constants/styles';

type Props = {
  style: StyleOption;
  selected: boolean;
  onPress: () => void;
};

export default function StyleCard({ style, selected, onPress }: Props) {
  return (
    <Pressable
      className={`flex-row items-center p-4 rounded-2xl mb-3 border ${selected ? 'border-white bg-white/10' : 'border-gray-700 bg-gray-900'}`}
      onPress={onPress}
    >
      <Text className="text-2xl mr-4">{style.icon}</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{style.label}</Text>
        <Text className="text-gray-400 text-sm">{style.description}</Text>
      </View>
      {selected && <Text className="text-white text-lg">✓</Text>}
    </Pressable>
  );
}
