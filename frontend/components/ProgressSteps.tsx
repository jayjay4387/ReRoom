import { View, Text } from 'react-native';

type Props = {
  steps: string[];
  current: number;
};

export default function ProgressSteps({ steps, current }: Props) {
  return (
    <View className="gap-4">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <View key={i} className="flex-row items-center gap-3">
            <View className={`w-6 h-6 rounded-full items-center justify-center ${done ? 'bg-green-500' : active ? 'bg-white' : 'bg-gray-700'}`}>
              <Text className={`text-xs font-bold ${done || active ? 'text-black' : 'text-gray-400'}`}>
                {done ? '✓' : stepNum}
              </Text>
            </View>
            <Text className={`text-sm ${active ? 'text-white' : done ? 'text-green-400' : 'text-gray-600'}`}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
