import { ComponentProps } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import CleanIcon from '@hugeicons/core-free-icons/CleanIcon';
import Sofa01Icon from '@hugeicons/core-free-icons/Sofa01Icon';
import CubeIcon from '@hugeicons/core-free-icons/CubeIcon';
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import { StyleOption } from '../constants/styles';
import { GLASS } from '../constants/theme';

type IconType = ComponentProps<typeof HugeiconsIcon>['icon'];

const STYLE_ICONS: Record<StyleOption['id'], IconType> = {
  minimal: CleanIcon,
  cozy: Sofa01Icon,
  modern: CubeIcon,
  maximalist: SparklesIcon,
};

const STYLE_ACCENT: Record<StyleOption['id'], string> = {
  minimal: '#6BB0D8',
  cozy: '#E8A45C',
  modern: '#7B6FD4',
  maximalist: '#D45FA8',
};

type Props = {
  style: StyleOption;
  selected: boolean;
  onPress: () => void;
};

export default function StyleCard({ style, selected, onPress }: Props) {
  const icon = STYLE_ICONS[style.id];
  const accent = STYLE_ACCENT[style.id];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shadow,
        selected && styles.shadowSelected,
        pressed && styles.pressed,
      ]}
    >
      <BlurView
        intensity={28}
        tint="light"
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${accent}22`, borderColor: `${accent}44` },
          ]}
        >
          <HugeiconsIcon
            icon={icon}
            size={24}
            color={selected ? accent : GLASS.textDark}
          />
        </View>

        <View style={styles.text}>
          <Text style={[styles.label, selected && { color: accent }]}>
            {style.label}
          </Text>
          <Text style={styles.description}>{style.description}</Text>
        </View>

        {selected && (
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={accent} />
        )}
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#143C5A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  shadowSelected: {
    shadowColor: '#2B8ADB',
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: GLASS.border,
    backgroundColor: GLASS.fill,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  cardSelected: {
    borderColor: 'rgba(43,138,219,0.75)',
    backgroundColor: 'rgba(43,138,219,0.12)',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: { flex: 1, gap: 3 },
  label: {
    color: GLASS.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(15,59,85,0.6)',
    fontSize: 12,
    fontWeight: '400',
  },
});
