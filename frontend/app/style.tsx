import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { STYLES } from '../constants/styles';
import StyleCard from '../components/StyleCard';

export default function StyleScreen() {
  const router = useRouter();
  const { setStyle } = useRoom();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-black px-6 pt-12">
      <Text className="text-white text-2xl font-bold mb-2">Choose a style</Text>
      <Text className="text-gray-400 text-sm mb-8">How should your room look?</Text>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {STYLES.map((s) => (
          <StyleCard
            key={s.id}
            style={s}
            selected={selected === s.id}
            onPress={() => setSelected(s.id)}
          />
        ))}
      </ScrollView>
      <Pressable
        className={`py-4 rounded-full mb-8 ${selected ? 'bg-white' : 'bg-gray-700'}`}
        disabled={!selected}
        onPress={() => {
          if (selected) {
            setStyle(selected as 'minimal' | 'cozy' | 'modern' | 'maximalist');
            router.push('/generating');
          }
        }}
      >
        <Text className={`text-center font-semibold text-base ${selected ? 'text-black' : 'text-gray-500'}`}>
          Redesign
        </Text>
      </Pressable>
    </View>
  );
}
