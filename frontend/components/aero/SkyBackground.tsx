import { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { SKY_GRADIENT, GRASS_GRADIENT, IRIDESCENT, SKY_FALLBACK } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function SkyBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={SKY_GRADIENT} style={StyleSheet.absoluteFill} />

      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cloud" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <Stop offset="0.7" stopColor="#ffffff" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width * 0.85} cy={40} rx={130} ry={130} fill="url(#sun)" />
        <Ellipse cx={width * 0.22} cy={150} rx={90} ry={34} fill="url(#cloud)" />
        <Ellipse cx={width * 0.84} cy={250} rx={62} ry={24} fill="url(#cloud)" opacity={0.7} />
      </Svg>

      <LinearGradient
        colors={IRIDESCENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.sweep]}
        pointerEvents="none"
      />

      <View style={styles.hillClip} pointerEvents="none">
        <LinearGradient colors={GRASS_GRADIENT} style={styles.hill} />
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_FALLBACK },
  content: { flex: 1 },
  sweep: { opacity: 0.5 },
  hillClip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, overflow: 'hidden' },
  hill: {
    position: 'absolute',
    bottom: 0,
    left: -width * 0.16,
    right: -width * 0.16,
    height: 150,
    borderTopLeftRadius: width,
    borderTopRightRadius: width,
  },
});
