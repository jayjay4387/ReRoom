import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { HugeiconsIcon } from '@hugeicons/react-native';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import SkyBackground from '../components/aero/SkyBackground';
import StyleCard from '../components/StyleCard';
import { useRoom } from '../context/RoomContext';
import { STYLES } from '../constants/styles';
import { GLASS, CTA_GREEN } from '../constants/theme';

const GLOSS: readonly [string, string] = ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)'];

export default function StyleScreen() {
  const router = useRouter();
  const { setStyle } = useRoom();
  const [selected, setSelected] = useState<string | null>(null);

  const handleRedesign = () => {
    if (!selected) return;
    setStyle(selected as 'minimal' | 'cozy' | 'modern' | 'maximalist');
    router.push('/generating');
  };

  return (
    <SkyBackground>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={GLASS.textDark} />
        </Pressable>
        <Text style={styles.htitle}>Pick your style</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>How should your room look?</Text>
        {STYLES.map((s) => (
          <StyleCard
            key={s.id}
            style={s}
            selected={selected === s.id}
            onPress={() => setSelected(s.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleRedesign}
          disabled={!selected}
          style={({ pressed }) => [
            styles.ctaWrap,
            selected && styles.ctaWrapActive,
            pressed && !!selected && styles.ctaPressed,
          ]}
        >
          {selected ? (
            <View style={styles.ctaClip}>
              <LinearGradient
                colors={CTA_GREEN}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaFill}
              >
                <LinearGradient
                  colors={GLOSS}
                  style={styles.ctaGloss}
                  pointerEvents="none"
                />
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />
                <Text style={styles.ctaTextActive}>Redesign</Text>
              </LinearGradient>
            </View>
          ) : (
            <View style={[styles.ctaClip, styles.ctaGhostBorder]}>
              <BlurView intensity={18} tint="light" style={[styles.ctaFill, styles.ctaGhostFill]}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color="rgba(15,59,85,0.35)"
                />
                <Text style={styles.ctaTextDisabled}>Redesign</Text>
              </BlurView>
            </View>
          )}
        </Pressable>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 54,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  htitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12 },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
    textShadowColor: 'rgba(20,80,140,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  footer: { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 8 },

  ctaWrap: { borderRadius: 999 },
  ctaWrapActive: {
    shadowColor: '#145A1E',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaPressed: { opacity: 0.9 },
  ctaClip: { borderRadius: 999, overflow: 'hidden' },
  ctaFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  ctaGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  ctaGhostBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)' },
  ctaGhostFill: { backgroundColor: 'rgba(255,255,255,0.32)' },
  ctaTextActive: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ctaTextDisabled: { color: 'rgba(15,59,85,0.4)', fontWeight: '600', fontSize: 15 },
});
