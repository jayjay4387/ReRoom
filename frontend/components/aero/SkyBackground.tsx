import { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
  Path,
  LinearGradient as SvgLG,
} from 'react-native-svg';
import { SKY_GRADIENT, IRIDESCENT, SKY_FALLBACK } from '../../constants/theme';

const { width } = Dimensions.get('window');

// Local meadow shades (kept here so theme.ts is untouched).
const HILL_BACK_TOP = '#9FE06A';
const HILL_BACK_BOTTOM = '#6FBE3F';
const HILL_FRONT_TOP = '#7CCD44';
const HILL_FRONT_BOTTOM = '#2E7D24';
const HILLTOP_HIGHLIGHT = 'rgba(220,255,180,0.7)';

const GRASS_H = 120;

// Back hill: a gentle wide swell sitting a touch higher than the front hill.
const BACK_HILL = `M0 ${GRASS_H} L0 52 ` +
  `C ${width * 0.28} 22, ${width * 0.52} 70, ${width * 0.72} 44 ` +
  `S ${width} 36, ${width} 50 ` +
  `L ${width} ${GRASS_H} Z`;

// Front hill: lower/forward crest for depth.
const FRONT_CREST_Y = 78;
const FRONT_HILL = `M0 ${GRASS_H} L0 ${FRONT_CREST_Y} ` +
  `C ${width * 0.22} ${FRONT_CREST_Y - 22}, ${width * 0.4} ${FRONT_CREST_Y + 10}, ${width * 0.6} ${FRONT_CREST_Y - 6} ` +
  `S ${width * 0.9} ${FRONT_CREST_Y - 18}, ${width} ${FRONT_CREST_Y - 4} ` +
  `L ${width} ${GRASS_H} Z`;

// Thin sunlit highlight tracing the front crest.
const FRONT_HIGHLIGHT = `M0 ${FRONT_CREST_Y} ` +
  `C ${width * 0.22} ${FRONT_CREST_Y - 22}, ${width * 0.4} ${FRONT_CREST_Y + 10}, ${width * 0.6} ${FRONT_CREST_Y - 6} ` +
  `S ${width * 0.9} ${FRONT_CREST_Y - 18}, ${width} ${FRONT_CREST_Y - 4}`;

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

      <Svg style={styles.meadow} width={width} height={GRASS_H} pointerEvents="none">
        <Defs>
          <SvgLG id="hillBack" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={HILL_BACK_TOP} />
            <Stop offset="1" stopColor={HILL_BACK_BOTTOM} />
          </SvgLG>
          <SvgLG id="hillFront" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={HILL_FRONT_TOP} />
            <Stop offset="1" stopColor={HILL_FRONT_BOTTOM} />
          </SvgLG>
        </Defs>

        {/* Distant rolling hill (lighter, slightly higher) */}
        <Path d={BACK_HILL} fill="url(#hillBack)" />

        {/* Foreground hill (darker, lower/forward for depth) */}
        <Path d={FRONT_HILL} fill="url(#hillFront)" />

        {/* Sunlit highlight along the front crest */}
        <Path d={FRONT_HIGHLIGHT} stroke={HILLTOP_HIGHLIGHT} strokeWidth={2} fill="none" />
      </Svg>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_FALLBACK },
  content: { flex: 1 },
  sweep: { opacity: 0.5 },
  meadow: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
